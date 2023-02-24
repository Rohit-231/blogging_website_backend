const mongoose = require('mongoose')
const dotenv = require('dotenv')

process.on('uncaughtException',err=>{
  console.log('UNCAUGHT EXCEPTION! SHUTTING DOWN');
  console.log(err.name, err.message);
  server.close(()=>{
    process.exit(1)
  })
})

dotenv.config({path:'./config.env'})
const app=require('./app')


const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

console.log("DB",DB);
mongoose
  .connect(DB,{
    useUnifiedTopology: true,
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
})
.then(con =>{
  // console.log(con.connections);
  console.log('DB connection successful!');
})


// SERVER
const port=process.env.PORT | 5000;
const server=app.listen(port, () =>{
  console.log(`App running on port ${port}...`);
});

//9.13 Express Unhandled Rejections
process.on('unhandledRejection',err=>{
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! SHUTTING DOWN');
  server.close(()=>{
    process.exit(1)
  })
})

//not performed 
// 8.26, 8.27, 8.28