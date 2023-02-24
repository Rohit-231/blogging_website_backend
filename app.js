const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet=require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp=require('hpp')

const blogRouter=require('./routes/blogRoutes')
const userRouter=require('./routes/userRoutes')

const AppError=require('./utils/appError')
const GlobalErrorHandler = require('./controllers/errorController')
const app=express();

const cors=require('cors');

// MIDDLEWARES
//SET SECURITY HTTP HEADERS
app.use(helmet())

//DEVELOPMENT LOGGING
console.log(process.env.NODE_ENV);
if(process.env.NODE_ENV === 'development'){
  app.use(morgan('dev'))
}

//10.20RATE LIMITER- limit request from same API
const limiter = rateLimit({
  max:100,
  windowMs:60*60*1000, //1hour window maximum 100 requests, can check status in headers in postman
  message:'Too many requests from this IP, please try again in an hour!'
})
app.use('/api',limiter)

//Body parser, for reading data frombody into req.body
app.use(express.json({limit:'100kb'})); 

//Data Sanitization against NoSQL query injection
app.use(mongoSanitize())

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist:['duration']
  })
)

app.use(cors());

//for serving static files such as img, html ets
app.use(express.static(`${__dirname}/public`)); 

// app.use((req,res,next) =>{
//   console.log('Hello from middleware');
//   next();
// })

app.use((req,res,next)=>{
  req.requestTime = new Date().toISOString();
  next();
})

//ROUTES

// app.get('/api/v1/blogs', getAllBlogs) //SIMPLE ROUTING
// app.get('/api/v1/blogs/:id', getBlog);
// app.post('/api/v1/blogs', createBlog)
// app.patch('/api/v1/blogs/:id', updateBlog )
// app.delete('/api/v1/blogs/:id', deleteBlog)


app.use('/api/v1/blogs',blogRouter); // MOUNTING ROUTER
app.use('/api/v1/users',userRouter);
app.all('*', (req,res,next)=>{
  // res.status(404).json({
  //   status:'fail',
  //   message:`Can't find ${req.originalUrl} on this server!`
  // })
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail'
  // err.statusCode=404

  next(new AppError(`Can't find ${req.originalUrl} on this server!`,404))
})

app.use(GlobalErrorHandler)
module.exports=app

// Middleware:-
// next() should be mentioned at the endianness, if not mentioned the middleware is incomplete 
// The placing of middleware is important. eg if the middleware is placed below the api callbackify, then it will not be executed

// express.json is used for body.parse() ie res.body

// morgan is used to provide the info on console: 
// GET /api/v1/blogs 200 2.858 ms - 139

