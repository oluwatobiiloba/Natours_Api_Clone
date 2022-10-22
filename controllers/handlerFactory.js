
const { model } = require("mongoose")
const APIFeatures = require("../utils/apiFeatures")
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id, { runValidators: true, })
    if (!doc) {
        return next(new AppError(`No document found with the ID (${req.params.id}) provided`, 404))
    }
    res.status(204).json(
        {
            status: 'successfully deleted',
            data: null
        })
})

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    })

    if (!doc) {
        return next(new AppError(`No doc found with the ID (${req.params.id}) provided`, 404))
    }
    res.status(200)
        .json(
            {
                status: 'success',
                data: {
                    data: doc
                }
            }
        );
})


exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(200)
        .json(
            {
                status: 'success',
                data: {
                    data: doc
                }
            }
        );
})

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) { query = query.populate(populateOptions) }
    const doc = await query

    if (!doc) {
        return next(new AppError(`No Document found with the ID (${req.params.id}) provided`, 404))
    }
    res.status(201).json(
        {
            status: 'success',
            data: {
                data: doc
            }
        }
    );

})

exports.getAll = Model =>
    catchAsync(async (req, res, next) => {
        //to allow for nested get reviews on tour
        let filter = {}
        if (req.params.tourId) {
            filter = { tour: req.params.tourId }
        }
        //execute query
        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const doc = await features.query;

        res.status(200)
            .json(
                {
                    status: 'successful',
                    results: doc.length,
                    time: req.requestTime,
                    data: {
                        data: doc
                    }
                }
            );
    }

    )

// exports.getAll = Model =>
//   catchAsync(async (req, res, next) => {
//     // To allow for nested GET reviews on tour (hack)
//     let filter = {};
//     if (req.params.tourId) filter = { tour: req.params.tourId };

//     const features = new APIFeatures(Model.find(filter), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();
//     // const doc = await features.query.explain();
//     const doc = await features.query;

//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: doc.length,
//       data: {
//         data: doc
//       }
//     });
//   });

