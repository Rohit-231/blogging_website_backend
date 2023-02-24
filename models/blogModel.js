const mongoose = require('mongoose')


const blogSchema = new mongoose.Schema({
  title:{
    type:String,
    required:[true, 'A blog must have a title'],
    unique:true,
    trim:true,
    minlength : [2, 'A blog title must have more or equal then 2 characters']
  },
  main_pic:String,
  author_name:{
    type:String,
    required:[true, 'A blog must have a author_name'],
    trim:true
  },
  author_pic:String,
  created_at:{
    type:Date,
    default:Date.now()
  },
  duration:{
    type:Number,
    required:[true, 'A tour must have a duration'],
    trim:true,
    validate:{
      validator : function(val){
        // this only points to current doc on NEW document creation
        return val>0
      },
      message:'duration must be greater than 0 minutes'
    }
  },
  body_content:{
    type:String,
    required:[true, 'A blog must have a author_name'],
    trim:true
  }
},{
  toJSON:{virtuals:true},
  toObject:{virtuals:true}
});

//VIRTUAL PROPERTIES -- not saved in DB
blogSchema.virtual('durationHours').get(function(){
  return this.duration*1.1/60;
})

// //DOCUMENT middleware: runs before .save() and .create()
// blogSchema.pre('save', function(next){
//   console.log('will save document ... ');
//   next()
// })

// blogSchema.post('save', function(doc,next){
//   console.log(doc);
//   next()
// })

const Blog = mongoose.model('Blog',blogSchema);
module.exports=Blog