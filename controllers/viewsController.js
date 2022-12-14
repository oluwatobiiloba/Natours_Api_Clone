const Review = require('../models/reviewModels');
const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');


exports.getOverview = catchAsync(async(req,res,next)=>{

    //1) Get tour data from collection
    const tours = await Tour.find();
    //2)build pug template

    //3) render the template using data
    res.status(200).render('overview',{
        title:'All Tours',
        tours:tours
    });
});


exports.getTour = catchAsync(async (req, res, next) => {
    // 1) Get the data, for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user'
    });
 
    if (!tour) {
      return next(new AppError('There is no tour with that name.', 404));
    }
    // console.log(tour.reviews)
    
    // for (rev in tour.reviews){
    //      console.log(rev)
    //  }
    // 2) Build template
    // 3) Render template using data from 1)
    res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour,
      
     
    });
    next()
  });

  exports.loginForm = (req,res) => {
    res.status(200).render('login',{
      title:'SignIn'
    })
  }