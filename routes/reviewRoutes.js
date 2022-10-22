const express = require("express");
const reviewControllers = require("./../controllers/reviewControllers");
const authControllers = require('./../controllers/authControllers');
const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(reviewControllers.getAllReviews)
    .post(authControllers.protect, authControllers.restrictTo('user'), reviewControllers.createReview)

router
    .route('/:id')
    .get(reviewControllers.getReviewById)
    .get(reviewControllers.getAllReviews)
    .patch(authControllers.protect, authControllers.restrictTo('user'), reviewControllers.updateReview)
    .delete(authControllers.protect, authControllers.restrictTo('admin'), reviewControllers.deleteReview)
module.exports = router;