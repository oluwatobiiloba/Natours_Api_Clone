
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModels')
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs')
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const { findOne } = require('./../models/userModels');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES })
}

const createSendToken = (user, statusCode, res) => {

    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 1000),
        httpOnly: true

    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    //hide passsword from output
    user.password = undefined
    res.cookie('jwt', token, cookieOptions)
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChanged: req.body.passwordChanged,
        role: req.body.role
    });

    token = signToken(newUser._id);
    createSendToken(newUser, 201, res);
})

exports.signin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //1)check if email and password exists
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }
    //2)check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('incorrect email or password', 401))
    }
    //) send token

    createSendToken(user, 200, res)

}
)

exports.signout = catchAsync(async(req,res,next) => {
    res.cookie('jwt','loggedout',{
        expires: new Date(Date.now() + 10 + 1000),
        httpOnly:true
    });
    res.status(200).json({status: 'success'})
})

exports.protect = catchAsync(async (req, res, next) => {
    //1) Get Jwt Token and check it it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }else if(req.cookies.jwt) {
        token = req.cookies.jwt
    }



    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access', 401))
    }
    //2) Validate Token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);


    //3) Check if user still exists
    const userExist = await User.findById(decoded.id);

    if (!userExist) {
        return next(new AppError('This user doesnt exist anymore', 401))
    }

    //4) Check if user changed password after the token was issued
    if (!userExist.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Password changed, log in again', 401))
    };

    //authentication passed, move on to next route
    req.user = userExist
    next();
})

exports.restrictTo = (...role) => {
    return (req, res, next) => {
        //roles is an array of user roles

        if (!role.includes(req.user.role)) {
            return next(new AppError('You are not authorised to perform this action', 403))

        }
        next();
    };
};

exports.forgotPassword = async (req, res, next) => {

    //check if email exist
    user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new AppError('There is no user registered with this email', 404))
    }
    //generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    //send to users email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a patch request with your new password and passswordconfirm to:${resetURL}.\n If you didn't forget your password, please ignore the email.`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (expires in 10 mins)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        console.log(err);
        user.createPasswordResetToken = undefined;
        user.createPasswordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email,try again later'),
            500);


    }


}

exports.resetPassword = async (req, res, next) => {
    //1) Get user based on the token
    const hashToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    console.log(hashToken)
    const user = await User.findOne({
        passwordResetToken: hashToken,
        passwordResetExpires: { $gt: Date.now() }
    })
    console.log(user)
    //2) If token has not expired, set new password
    if ((!user)) {
        return next(new AppError('Token is invalid or has expired', 400))
    }
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.confirmNewPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //3) Update ChangedpasswordAt property

    //4) log the user in, send JWT
    createSendToken(user, 200, res)
    next();
}

exports.updateMyPassword = catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user.id).select('+password')
    console.log(user)

    //2) check if posted current password is correct
    if (!(await user.correctPassword(req.body.password, user.password))) {
        return next(new AppError('Incorrect current password'), 401)
    }

    //3)if so, update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.confirmNewPassword;
    await user.save();
    //4)Log user in, send jwt
    createSendToken(user, 200, res);
    next();
})

//Rendered pages protection
exports.isLoggedIn = async (req, res, next) => {
    //1) Get Jwt Token and check it it exists
   
     if(req.cookies.jwt) {

    try{
        //2) Validate Token
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);


    //3) Check if user still exists
    const userExist = await User.findById(decoded.id);

    if (!userExist) {
        return next()
    }

    //4) Check if user changed password after the token was issued
    if (!userExist.changedPasswordAfter(decoded.iat)) {
        return next()
    };

    //authentication passed, move on to next route
    res.locals.user = userExist
    return next();
      
    }catch(err){
        return next();
    }
}

    next();
}
