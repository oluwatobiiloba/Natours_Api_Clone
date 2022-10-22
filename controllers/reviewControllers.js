const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModels');
const handler = require('./handlerFactory');

exports.getAllReviews = handler.getAll(Review);
exports.getReviewById = handler.getOne(Review);
exports.deleteReview = handler.deleteOne(Review);
exports.updateReview = handler.updateOne(Review);
// exports.setTourUserIds = (req, res, next) => {
//     if (!req.body.tour) {
//         req.body.tour = req.params.tourId;
//     }
//     if (!req.body.user) {
//         req.body.user = req.user._id;
//     }
//     next()
// }
// exports.createReview = handler.createOne(Reviews);

exports.createReview = catchAsync(async (req, res, next) => {
    if (!req.body.tour) {
        req.body.tour = req.params.tourId
    }
    const newReview = await Review.create(
        {
            content: req.body.content,
            rating: req.body.rating,
            author: req.user._id,
            tour: [req.body.tour],
        });
    res.status(201).json(
        {
            status: 'success',
            data: {
                review: newReview
            }
        }
    );
    //console.log(req.body);
})

// exports.setTourUserIds = (req, res, next) => {
//   // Allow nested routes
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id;
//   next();
// };
