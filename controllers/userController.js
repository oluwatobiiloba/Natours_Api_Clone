const Users = require("../models/userModels");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const handler = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//     destination: (req,file, callback) => {
//         callback(null,'public/img/users');
//     },
//     filename:(req,file,callback) => {
//         const ext = file.mimetype.split('/')[1];

//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

const multerStorage = multer.memoryStorage()

const multerFilter = (req,file,callback) =>{
    const type = file.mimetype.split('/')[0];
    if (type === "image") {
        callback(null,true)
    }else{
        callback(new AppError('Not an image! Please upload only images',400),false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req,res,next)=>{
    if(!req.file)return next();

    req.file.filename =`user-${req.user.id}-${Date.now().jpeg}`

    sharp(req.file.buffer)
    .resize(500,500)
    .toFormat('jpeg')
    .jpeg({quality:90})
    .toFile(`public/img/users/${req.file.filename}`);
    next();
};

const filterObj = (obj, ...allowedfields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if (allowedfields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}


exports.deleteMe = catchAsync(async (req, res, next) => {
    //Find user and select active property
    // await Users.findByIdAndUpdate(req.user.id,{active:false})
    const user = await Users.findById(req.user.id).select('+active')
    user.active = req.body.active;
    await user.save({ runValidators: false })

    res.status(201).json({
        status: 'success',
        message: null
    })
})

exports.updateMe = catchAsync(async (req, res, next) => {
    //1) Create error if user POSTS password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This is not for password update', 400));
    }
    //2)Update user document
    const filteredBody = filterObj(req.body, 'name', 'email');

    //add image name
    if(req.file)filteredBody.photo = req.file.filename
    //3)Filter fiels not allowed for updates
    const user = await Users.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });

    res.status(200).json({
        status: "sucess",
        data: user
    })
})

exports.getMe = (req,res,next) => {
    req.params.id = req.user.id;
    next()
};

exports.createUser = (req, res) => {

    res.status(500).json(
        {
            status: 'error',
            message: 'route not yet defined! Please SignUp'
        }
    )
}

//Do not update password with
exports.updateUser = handler.updateOne(Users);
exports.getAllUsers = handler.getAll(Users);
exports.deleteUser = handler.deleteOne(Users);
exports.getUser = handler.getOne(Users)