
const AppError = require('../utils/appError');
const { findById } = require('./../models/tourModels');
const Tour = require('./../models/tourModels');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync')
const handler = require('./handlerFactory')
// const tours = JSON.parse( fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage.price';
    req.query.fields = 'name, price, ratingsAverage,summary,difficulty';
    next();
};


exports.createTour = handler.createOne(Tour);

exports.getAllTours = handler.getAll(Tour);


exports.updateTour = handler.updateOne(Tour);

exports.deleteTour = handler.deleteOne(Tour);


// exports.getTourbyId = handler.getOne(Tour, {
//     path: 'reviews',
//     select: 'content author rating createdAt -tour'
// })

exports.getTourbyId = catchAsync(async(req,res,next)=>{
    const tour = await Tour.findById(req.params.id).populate('reviews');
    
    if(!tour){
        return next(new AppError('No tour found with that ID',404));
    }

    res.status(200).json(
        {
            status: 'success',
            data:{
                tour
            }
        }
    )
    next();
})

exports.getToursWithin = catchAsync(async(req,res,next) =>{
    const {distance,latlng,unit} = req.params;
    const [lat,lng] = latlng.split(',');
    const radius = (unit === 'mi') ? distance / 3963.2 : distance / 6378.1;
    
    if(!lat || !lng){
        next(new AppError("Please provide latitude and longitude in the format lat,lng",400))
    }
    
    const tours = await Tour.find({startLocation: { $geoWithin: { $centerSphere: [[lng, lat],radius]}}});

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data:{
            data:tours
        }
    })
});

exports.getToursDistance = catchAsync(async (req,res,next) => {
    const {latlng,unit} = req.params;
    const [lat,lng] = latlng.split(',');
    
const multiplier = (unit === 'mi') ? 0.000621371 : 0.001;

    if(!lat || !lng){
        next(new AppError("Please provide latitude and longitude in the format lat,lng",400))
    }
    
    const distances = await Tour.aggregate([
        {
            //always the first stage
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng*1,lat*1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project:{
                distance: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({
        status: 'success',
        data:{
            data:distances
        }
    })
})

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.0 } }
        },

        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        },

    ]);
    res.status(201).json(
        {
            status: 'success',
            data: {
                stats
            }
        }
    );
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([

        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numofTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numofTourStarts: -1 }

        },
        {
            $limit: 12
        }
    ]);
    res.status(201).json(
        {
            status: 'success',
            data: {
                plan
            }
        }
    );
}
)