// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModels');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

// //1) review,rating,created at, ref to tour,ref to user

// const mongoose = require('mongoose')
// const Tour =  require('./tourModels')

// const reviewSchema = new mongoose.Schema({

//     content: {
//         type: String,
//         require: [true, 'review should not be empty']
//     },
//     rating: {
//         type: Number,
//         require: [true, 'Review must have a rating'],
//         max: [5, 'Maximum rating of 5'],
//         min: [1, 'Minimum rating of 1'],
//         default: 4.5,

//     },
//     createdAt: {
//         type: Date,
//         default: Date.now(),
//     },
//     author: [

//         {
//             type: mongoose.Schema.ObjectId,
//             ref: 'User'
//         }
//     ],
//     tour: [
//         {
//             type: mongoose.Schema.ObjectId,
//             ref: 'Tour'
//         }
//     ],


// },
//     {
//         toJSON: { virtuals: true },
//         toObject: { virtuals: true },
//     })

// reviewSchema.index({ tour: 1, user: 1}, {unique:true});

// reviewSchema.pre(/^find/, function (next) {
//     this.populate({
//         path: 'tour',
//         select: 'name'
//     }).populate({
//         path: 'user',
//         select: 'name photo'
//     });
//     next();
// })

// reviewSchema.statics.calcAverageRatings = async function(tourId){
//   const stat = await this.aggregate(
//         [
//             {
//                 $match: {tour : tourId}
//             },
//             {
//                 $group:{
//                     _id: '$tour',
//                     nRating: { $sum : 1},
//                     avgRating: {$avg: '$rating'}
//                 }
//             }
//         ]
//     );

//     if(statusbar.length>0)
//      {  await Tour.findByIdAndUpdate(tourId,{
//             ratingsQuantity: stat[0].nRating,
//             ratingsAverage: stat[0].avgRating
//         })} else{
//             await Tour.findByIdAndUpdate(tourId,{
//                 ratingsQuantity: 0,
//                 ratingsAverage: 4.5,
//             })
//         }

// };

// reviewSchema.post('save', function(){
//     //this points to the current review

//     this.constructor.calcAverageRatings(this.tour);
   
// })

// reviewSchema.pre(/^findOneAnd/, async function(next){
//     //retrieve current document and save on current query
//     this.init = await this.findOne();
// next()
// });


// reviewSchema.post(/^findOneAnd/, async function(next){
   
//     await this.init.constructor.calcAverageRatings(this.init.tour);
// })

// const Review = mongoose.model('Review', reviewSchema);

// module.exports = Review;

