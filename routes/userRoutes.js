
const express = require('express');
const userControllers = require('./../controllers/userController')
const authControllers = require('./../controllers/authControllers')


const router = express.Router();



router
    .patch('/resetPassword/:token', authControllers.resetPassword)

router
    .post('/forgotpassword', authControllers.forgotPassword)
   
router
    .post('/signup', authControllers.signup)
    .post('/signin', authControllers.signin)
    .get('/signout', authControllers.signout)

//Protected routes below
router.use(authControllers.protect)

router
    .patch('/updateMyPassword', authControllers.protect, authControllers.updateMyPassword)

router
    .get('/me',userControllers.getMe,userControllers.getUser)

router
    .patch('/updateMe',userControllers.uploadUserPhoto,userControllers.resizeUserPhoto,userControllers.updateMe)

router
    .delete('/deleteMe', userControllers.deleteMe)

//Grand admin acess only
router.use(authControllers.restrictTo('admin'))
router
    .route('/')
    .get(userControllers.getAllUsers)
    .post(userControllers.createUser);




router
    .route('/:id')
    .patch(userControllers.updateUser)
    .get(userControllers.getUser)
    .delete(authControllers.restrictTo('admin'), userControllers.deleteUser);


module.exports = router;