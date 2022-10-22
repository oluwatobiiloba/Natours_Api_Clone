const express = require('express');
const viewsController = require('../controllers/viewsController');
const router = express.Router();
const authController = require('../controllers/authControllers')

router.use(authController.isLoggedIn)
router.get('/',viewsController.getOverview);
router.get('/login',viewsController.loginForm)
router.get('/tour/:slug',viewsController.getTour)

module.exports = router;