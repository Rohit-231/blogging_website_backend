const AppError = require('../utils/appError')
const Blog =require('./../models/blogModel')
const APIFeatures=require('./../utils/apiFeatures')

const catchAsync=require('./../utils/catchAsync')

// const blogs = {message:'Hello from the server side',
// app:'Blogger_app'}


// exports.checkID  = (req,res,next, val)=>{
//   console.log(`Blog ID is : ${val}`);

//   if(req.params.id*1 > blogs.length && 2==3){
//     return res.status(404).json({
//       status:'fail',
//       message:'Invalid ID'
//     });
//   }
//   next();
// }

// exports.checkBody=(req,res,next)=>{
//   if(!req.body.title || !req.body.blog_pic ||
//     !req.body.author_name ||!req.body.author_pic ||
//     !req.body.created_at ||!req.body.duration ||
//     !req.body.body_content  ){
//     return res.status(400).json({
//       status:'fail',
//       message:'missing title or author_pic or author_name or author_pic or created_at or duration or body_content'
//     })
//   }
//   next();
// }

exports.aliasSmallestBlog=(req,res,next) => {
  req.query.limit = '1'
  req.query.sort='duration'
  req.query.fields ='title,author_name,duration,body_content'
  next()
}


exports.getAllBlogs=async(req,res,next)=>{
  try{
    console.log(req.query);

    // //BUILD QUERY
    // // 1A Filtering
    // const queryObj = {...req.query};
    // const excludedFields = ['page', 'sort', 'limit','fields']
    // excludedFields.forEach(el => delete queryObj[el])
    
    // // 1B Advanced Filtering
    // // { duration: { gte: '' } } before conversion
    // // { duration: { $gte: '' } }  after conversion ie this works in mongoDB
    // let queryStr = JSON.stringify(queryObj)
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr));

    // let query = Blog.find(JSON.parse(queryStr))

    // 2. SORTING
    // if(req.query.sort){
    //   const sortBy = req.query.sort.split(',').join(' ')
    //   query=query.sort(sortBy)
    // }else{
    //   query=query.sort('-created_at')
    // }

    //3. FILED LIMITING  --only making some fields public
    // if(req.query.fields){
    //   const fields=req.query.fields.split(',').join(' ')
    //   query= query.select(fields)
    // }else{
    //   query= query.select('-__v') // - sign excludes the field __v
    // }

    //4. Pagination
    // const page= req.query.page*1 || 1;
    // const limit=req.query.limit*1 || 100;
    // const skip = (page-1)*limit;

    // query=query.skip(skip).limit(limit); //skip does the sjkipping of documents of DB

    // if(req.query.page){
    //   const numBlogs=await Blog.countDocuments();
    //   if(skip>=numBlogs)throw new Error('This page does not exist, page limit exceeded')
    // }

    // EXECUTING QUERY
    // const allBlogs=await Blog.find();
    const features = new APIFeatures(Blog.find(),req.query)
                                                .filter().sort()
                                                .limitFields()
                                                .paginate()
    const allBlogs=await features.query;
    console.log("allBlogs",allBlogs);
    res.status(200).json({
        status:'success',
        results:allBlogs.length,
        data:{
          allBlogs
        }
      })
  }catch(err){
    // res.status(404).json({
    //   status:'failed',
    //   message:err
    // })
    next(err)
  }
};

exports.getBlog=async(req,res,next)=>{

  try{
    console.log("inside ",req.params.id);

    const blog=await Blog.findById(req.params.id) //{_id:req.params.id}

    if(!blog){
      return next(new AppError('No blog found with that ID',404))
    }

    res.status(200).json({
      status:'success',
      data:{
        blog
      }
    })
  }catch(err){
    // res.status(400).json({
    //   status:'fail',
    //   message:'Invalid id'
    // })
    next(err)
  }
}
//new
exports.createBlog=catchAsync(async (req,res,next)=>{

    // Method1
    // const newBlog=new Blog({})
    // newBlog.save()

    const newBlog= await Blog.create(req.body);

    res.status(201).json({
      status:'success',
      data:{
        tour:newBlog
      }
    })
})
//old
// exports.createBlog=async (req,res,next)=>{

//   try{
//     // Method1
//     // const newBlog=new Blog({})
//     // newBlog.save()

//     const newBlog= await Blog.create(req.body);

//     res.status(201).json({
//       status:'success',
//       data:{
//         tour:newBlog
//       }
//     })
//   }catch(err){
//     next(err)
//   }
// }

exports.updateBlog=async(req,res,next) => {
  try{
    const blog=await Blog.findByIdAndUpdate(req.params.id,req.body,{
      new:true,// new updated document is stored
      runValidators:true //checks the schema validations
    })
    
    if(!blog){
      return next(new AppError('No blog found with that ID',404))
    }

    res.status(200).json({
      status:'success',
      blog
    })
  }catch(err){
    // res.status(400).json({
    //   status:'fail',
    //   message:err
    // })
    next(err)
  }
}

exports.deleteBlog=async(req,res,next) => {
  try{
    await Blog.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status:'success',
      message:'successfully deleted'
    })
  }catch(err){
    // res.status(404).json({
    //   status:'fail',
    //   message:err
    // })
    next(err)
  }
}

exports.getBlogStats = async (req,res,next) =>{

  try{

    const stats = await Blog.aggregate([
      {
        $match:{duration:{$gte:0}}
      },{
        $group:{
          _id:null,
          numBlogs:{$sum:1},
          totalDuration:{$sum:'$duration'},
          avgDuration:{$avg:'$duration'}
        }
      }
    ])

    res.status(200).json({
      status:'success',
      data:{
        stats
      }
    })
  }catch(err){
    // console.log(err);

    // res.status(404).json({
    //   status:'fail',
    //   message:err
    // })
    next(err)
  }

}