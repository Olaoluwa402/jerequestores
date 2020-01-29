const express = require("express");
const router  = express.Router();
const passport = require("passport");
const Blog_Category = require("../models/blogCategory");
const Blog = require("../models/blog");



// All category
router.get("/", async (req, res) => {
	let searchOptions = {};
	if (req.query.name != null && req.query.name !== '') {
		searchOptions.name = new RegExp(req.query.name, 'i')
	}
  try{
   	const categories = await Blog_Category.find(searchOptions);
  	 res.render("blog-category/index", {
  	 	categories:categories,
  	 	searchOptions: req.query
  	 });
   } catch (error){
  	req.flash("error", "unable to find category");
  	res.redirect("/blog-category");
   }
});



// show create new category form
router.get("/new", function(req, res){
    res.render("blog-category/new");
});

// handle category form data
router.post("/", async (req, res) => {
    // get data from form and add to category array
    const name = req.sanitize(req.body.name);
    const newCategory = {
    	name: name, 
    };
    // Create a new category and save to DB
    try{
    	const newlycreated = await Blog_Category.create(newCategory);
    	//redirect back to category page
           res.redirect("/blog-category");
    } catch (error){
    	req.flash("error", "unable create category");
  		res.redirect("/blog-category/new");
    }
 });

 // Render all blogs under each category
router.get("/:slug", async (req, res) => {
	// res.send("Category" + req.params.id)
	try{ 
		const resp = await Blog.find().sort({createdAt: 'desc'}).limit(12).populate({"path": "category", match:{"slug":req.params.slug}}).exec();
		const blogs = resp.filter(function(i){
			    return i.category != null;
			  });
    const myTotalResp= await Blog.find().populate({"path": "category", match:{"slug":req.params.slug}}).exec();
    const myTotal = myTotalResp.filter(function(i){
          return i.category != null;
        });
    const catShow = await Blog_Category.find({"slug":req.params.slug});
    const latestBlogs = await Blog.find().sort({createdAt: 'desc'}).limit(12)
    const categoryId = req.params.slug
    console.log(blogs)
			 res.render("blog-category/showAll", {blogs: blogs, myTotal: myTotal, categoryId:categoryId, catShow:catShow, latestBlogs:latestBlogs});
	} catch(err){
          console.log(err)
		    	req.flash("error", "something went wrong with fetching associated blogs");
		  		res.redirect("/blog");
       }
     });

// ajax call for pagination
router.get("/:slug/get-category/:page/:limit", async (req, res) => {
  const page = req.params.page
  const limit = req.params.limit

  const startIndex = (page - 1) * limit
  const endIndex = page * limit
   try{
    const resp = await Blog.find().populate({"path": "category", match:{"slug":req.params.slug}}).sort({createdAt: 'desc'}).skip(parseInt(startIndex)).limit(parseInt(limit)).exec();
    const blogs = resp.filter(function(i){
          return i.category != null;
        });
    res.send(blogs);
   } catch(error){
      if(error){
        console.log(error);
      }
   }
})


router.get("/:id/edit", function(req, res){
  Blog_Category.findById(req.params.id, function(err, category){
    if(err || !category){
      req.flash("error", "Category not found")
      res.redirect("/blog-category");
    }else{
      res.render("blog-category/edit", {cate : category});
    }
  })
 });

router.put("/:id", async (req, res) => {
     let category
    try{
       category = await Blog_Category.findById(req.params.id);
       category.name = req.body.name
         await category.save();
           res.redirect("/blog-category");
    } catch (error){
      if(category == null){
        res.redirect("/blog")
      } else {
         req.flash("error", "error updating category");
         res.render("/blog-category/new", {category:category});
      }
      
    }
 });

router.delete("/:id", async (req, res) => {
      let category
    try{
       category = await Blog_Category.findById(req.params.id);
         await category.remove();
           res.redirect("/blog-category");
    } catch (error){
      if(category == null){
        res.redirect("/blog")
      } else {
         req.flash("error", "unable to delete category. Be sure category has no blogs!");
          res.redirect("/blog-category");
      }
      
    }
 });




module.exports = router;
