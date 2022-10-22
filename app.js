const path = require('path');
const pug = require('pug')
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const appError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
//Set Security Http Headers
app.use(helmet());

//development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
//Data Sanitization againist noSQL injection
app.use(mongoSanitize());

//Data sanitation against xss
app.use(xss());


//Body Parse, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());




//prevent parameter pollution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));


//Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    console.log(req.headers);
    next();
})

//limit request from same IP

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requets from this IP,please try again in an hour"
})

// app.get('/',(req,res) => {
//     res.status(200).render('base',{
//         tour:"The Forest Hiker",
//         user:'Jonas'
//     });
// })

// app.get('/overview',(req,res)=>{
//     res.status(200).render('overview',{
//         title:'All Tours'
//     });
// });

// app.get('/tour',(req,res)=>{
//     res.status(200).render('tour',{
//         title: 'The forest Hiker'
//     })
// })

app.use('/api', limiter);
app.use('/',viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, res, next) => {
    // res.status(400).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server`
    // })
    next(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);


module.exports = app