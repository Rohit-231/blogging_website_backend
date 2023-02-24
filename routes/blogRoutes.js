const express=require('express')
const blogController=require('./../controllers/blogController')
const authController=require('./../controllers/authController')

const router=express.Router()


// router.param('id', blogController.checkID)
router.route('/smallest-blog')
      .get(blogController.aliasSmallestBlog, blogController.getAllBlogs)

router.route('/blog-stats').get(blogController.getBlogStats)

router
  .route('/')
  .get(blogController.getAllBlogs)
  // .get(authController.protect,blogController.getAllBlogs)
  .post(blogController.createBlog); //blogController.checkBody,

router
  .route('/:id')
  .get(blogController.getBlog)
  .patch(blogController.updateBlog)
  .delete(authController.protect,authController.restrictTo('admin'),blogController.deleteBlog);


module.exports=router