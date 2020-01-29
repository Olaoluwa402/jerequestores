const express = require("express");
const router = express.Router();
const passport = require("passport");
const Blog_Category = require("../models/blogCategory");
const Blog = require("../models/blog");
// const middleware = require("../middleware");


// multer and cloudinary confiq
const multer = require('multer');
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, limits:{ fileSize: 2000000},fileFilter: imageFilter}).single('image');

const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'oladan', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});



router.get("/", async (req, res, next) => {
	  let blogs
    let myTotal
  try {
      blogs = await Blog.find().sort({createdAt: 'desc'}).limit(12);
      myTotal = await Blog.find();

      res.locals.metaTags = { 
        title: "Jereque blog post", 
        description: "blog blog blog",   
        keywords: "Jereque store online shopping blog post" 
    }; 

      res.render("blog/index", {
         layout: "layouts/layout",
        blogs: blogs,
        myTotal: myTotal
      });
   } catch(error){
      if(error){
        console.log(error);
      }
   }
});

// ajax call
router.get("/get-blogs/:page/:limit", async (req, res) => {

  const page = req.params.page;
  const limit =req.params.limit;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
   try{
    const  blogs = await Blog.find().sort({createdAt: 'desc'}).skip(parseInt(startIndex)).limit(parseInt(req.params.limit));
    res.send(blogs);
   } catch(error){
      if(error){
        console.log(error);
      }
   }
})



router.post("/", async (req, res, next) => {
    upload(req, res, async (err) =>{
        if(err){
            req.flash('error', err.message + ' ' + "Image size should not exceed 200kb");
            res.redirect('/blogs');
            // const categories = await Category.find({});
            // const book = await Book.find({});
            // res.render('book/new', {msg:err, categories:categories, book:book});
        }else{
        	// console.log(req.file);
           cloudinary.uploader.upload(req.file.path, function(err, result) {
           if(err){
                  //console.log( "There is an error" + err)
                  req.flash('error', "uploading failed. Please try again");
                  return res.redirect('/blogs/new');
           }
                 console.log(result);
                  // add cloudinary url and  image's public_id for the image to the story object under image property
                 const title = req.body.blog.title;
                 const   category = req.body.category;
                 const image = req.body.image = result.secure_url;
                 const imageId = req.body.imageId = result.public_id;
                 const body = req.sanitize(req.body.blog.body);
                 const author = {
                                  id: req.user._id,
                                  lastName: req.user.lastName
                              };
                 const newBlog = {title:title,  category: category, image:image, body:body, imageId:imageId, author:author};
                 // save to db
                 Blog.create(newBlog, function(err, newlyCreated){
                 if(err){
                 	console.log(err);
                 req.flash("error", "error saving to database. Please ensure all fields are field");
                 res.redirect("/blogs/new");
                 } else{
                 //redirect back to books page
                   req.flash("success", "successfully posted new Blog");
                   res.redirect("/blog");
                  }
             });
          });
        }
        
    })
});

// render create blog page
router.get("/new", function(req, res){
   renderNewPage(res, new Blog());
});

// show one post
router.get("/:slug", function(req, res){
   Blog.findOne({"slug": req.params.slug}).populate({
      path: "comments",
      populate:{path: "replies"},
      options: {sort: {createdAt: -1}}
      }).exec(function(err, foundBlog){
     if(err || !foundBlog){
      console.log(err)
            req.flash("error", "Blog not found")
           res.redirect("/blog")
        } else {
             res.locals.metaTags = {
                title: "Jereque blog post Jereque store online shopping blog post Jereque store online shopping blog post Jereque store online shopping blog post v", 
                description: "blog blog blog",   
                keywords: "Jereque store online shopping blog post",
            }; 

            res.locals.metaTagsDynamic = {
                meta: foundBlog, 
            }; 

            //render show template with that Book
            res.render("blog/show", {
              layout: "layouts/layout",
              blog: foundBlog,
            });
        }
   });
});

router.get("/:id/edit", function(req, res){
   Blog.findById(req.params.id, function(err, foundBlog){
       if(err || !foundBlog){
           req.flash("error", "Blog not found")
           res.redirect("/blog");
       } else {
           res.render("blog/edit", {blog: foundBlog});
       }
   });
});

  // update route
router.put("/:id", async (req, res) => {
     Blog.findById(req.params.id, async (err, foundBlog) => {
        if(err){
            console.log(err);
              if(foundBlog != null){
                render(blog/edit)
              } else{
                res.redirect("/blog");
              }
        } else {
            upload(req, res, async (err) => {
            
              if(err){
                    req.flash('error', err.message + ' ' + "Image size should not exceed 200kb");
                    res.redirect('/blog/new')
                  }else{ 
                      if (req.file) {
                        try {
                          await cloudinary.uploader.destroy(foundBlog.imageId);
                          const result = await cloudinary.uploader.upload(req.file.path);
                          foundBlog.imageId = result.public_id;
                          foundBlog.image = result.secure_url;
                      } catch(err) {
                          req.flash("error", err.message);
                          return res.redirect("back");
                      }
                     }
                    }
                       
                      foundBlog.title = req.body.blog.title;
                      foundBlog.body = req.sanitize(req.body.blog.body);

                   
                       foundBlog.save();
                       req.flash("success","Blog successfully Updated!");
                      
                      let showUrl = "/blog/" + foundBlog.slug;
                       res.redirect(showUrl);
          });
        }
     });
});

router.delete("/:id", async (req, res) => {
  let blog
  try{
      blog = await Blog.findById(req.params.id);
      // delete the blog 
        await cloudinary.uploader.destroy(blog.imageId);
        await blog.deleteOne();
        req.flash("success", "Blog deleted successfully!");
        res.redirect("/blog");
  } catch {
      if(blog != null){
         req.flash("error", 'Could not remove blog');
        res.redirect("/blog" + blog.slug)
      } else{
        res.redirect("/blog")
      }
  } 
 
});


//  // like/unlike pusher handling
// router.post('/blogs/:id/act', function(req, res, next){
//     console.log("you hit it")
//     const action = req.body.action;
//     const counter = action === 'Like' ? 1 : -1;
//     Blog.update({_id: req.params.id}, {$inc: {likes: counter}}, {}, function(err, numberAffected){
        
//         var Pusher = require('pusher');

//         var pusher = new Pusher({
//             appId: process.env.PUSHER_APP_ID,
//             key: process.env.PUSHER_APP_KEY,
//             secret: process.env.PUSHER_APP_SECRET,
//             cluster: process.env.PUSHER_APP_CLUSTER,
//         });

//         let payload = { action: action, blogId: req.params.id };
//         pusher.trigger('blog-events', 'blogAction', payload, req.body.socketId);
//         res.send('');
//     });
// });



async function renderNewPage(res, blog, error = false){
   try{
      const categories = await Blog_Category.find({});
      const params =  {
           categories: categories,
               blog: blog
         }
         if(error){
          console.log(error)
           req.flash("error", 'Unable to create blog');
            res.redirect("/blog/new");
        }
           res.render("blog/new", params);
   }catch(error){
     if(error){
       res.redirect("/blog/new");
     }
  }
}

async function renderEditPage(res, blog, error = false){
   try{
      const categories = await Category.find({});
      const params =  {
           categories: categories,
               blog: blog
         }
         if(error){
          console.log(error)
           req.flash("error", 'Unable to edit blog');
            res.redirect("/blog/new");
        }
           res.render("blog/edit", params);
   }catch(error){
     if(error){
       res.redirect("/blog/new");
     }
  }
}



module.exports = router;