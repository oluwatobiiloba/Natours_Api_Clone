const express = require('express');
const tourController = require('./../controllers/tourController');
const authControllers = require('./../controllers/authControllers');
const router = express.Router();
const reviewRouter = require('./../routes/reviewRoutes');


router.use('/:tourId/reviews', reviewRouter)

router
    .route('/monthly-plan/:year')
    .get(authControllers.protect, authControllers.restrictTo('admin', 'lead-guide'),tourController.getMonthlyPlan)

router
    .route('/tour-stats')
    .get(tourController.getTourStats)


router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin)
    ///tours-distance?distance=233&centre=-40,45&unit=mi

router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getToursDistance)

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours)

router
    .route('/')
    .get(authControllers.protect, tourController.getAllTours)
    .post(authControllers.protect, authControllers.restrictTo('admin', 'lead-guide'), tourController.createTour);

router
    .route('/:id')
    .patch(authControllers.protect, authControllers.restrictTo('admin', 'lead-guide'), tourController.updateTour)
    .get(tourController.getTourbyId)
    .delete(authControllers.protect, authControllers.restrictTo('admin', 'lead-guide'), tourController.deleteTour);


module.exports = router;