const fs=require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

const Blog=require('./../../models/blogModel')
const { deleteOne } = require('./../../models/blogModel')

dotenv.config({path:'./config.env'})

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
})
.then(con =>{
  // console.log(con.connections);
  console.log('DB connection successful!');
})

//Read JSON file
const blogs=JSON.parse(fs.readFileSync(`${__dirname}/blogs_sample.json`,'utf-8'))

// IMPORT DATA INTO MONGO DB
const importData=async ()=>{
  try{
    await Blog.create(blogs)
    console.log("Data successfuly loaded");
  }
  catch(err){
    console.log(err);
  }
  process.exit();
}

// DELETE DATA INTO MONGO DB
const deleteData=async ()=>{
  try{
    await Blog.deleteMany()
    console.log("Data successfuly deleted");
  }
  catch(err){
    console.log(err);
  }
  process.exit();
}

console.log(process.argv);

if( process.argv[2]==="--import"){
  importData()
}else if( process.argv[2]==="--delete"){
  deleteData()
}

