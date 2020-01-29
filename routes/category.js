const express = require("express");
const router  = express.Router();
const passport = require("passport");
const Category = require("../models/category");
const Product = require("../models/product");
// const slugify = require('slugify');



// All category
router.get("/", async (req, res) => {
	let searchOptions = {};
	if (req.query.name != null && req.query.name !== '') {
		searchOptions.name = new RegExp(req.query.name, 'i')
	}
  try{
   	const categories = await Category.find(searchOptions);
  	 res.render("category/index", {
  	 	categories:categories,
  	 	searchOptions: req.query
  	 });
   } catch (error){
  	req.flash("error", "unable to find category");
  	res.redirect("/category");
   }
});

// called by AJAX
router.get("/partials", async (req, res) => {
	
  try{
   	const categories = await Category.find({});
  	 res.send(categories);
  	 
   } catch (error){
  	req.flash("error", "unable to find category");
  	res.redirect("/category");
   }
});



// show create new category form
router.get("/new", function(req, res){
    res.render("category/new");
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
    	const newlycreated = await Category.create(newCategory);
    	//redirect back to category page
           res.redirect("/category");
    } catch (error){
    	req.flash("error", "unable create category");
  		res.redirect("/category/new");
    }
 });

// Render all products under each category
router.get("/:slug", async (req, res) => {
	// res.send("Category" + req.params.id)
   
	try{ 
		const resp = await Product.find().sort({createdAt: 'desc'}).populate({"path": "category", match:{"slug":req.params.slug}}).limit(20).exec();
		const products = resp.filter(function(i){
			    return i.category != null;
			  });
    const myTotalResp= await Product.find().populate({"path": "category", match:{"_id":req.params.id}}).exec();
    const myTotal = myTotalResp.filter(function(i){
          return i.category != null;
        });
    const catShow = await Category.find({"slug":req.params.slug});
    const categoryId = req.params.slug

      res.locals.metaTags = { 
        title: "Jereque stores categories of product", 
        description: "categories categories ",   
        keywords: "Jereque store online shopping blog post" 
    }; 


			 res.render("category/show", {
         layout: "layouts/layout",
          products: products, 
          myTotal: myTotal, 
          categoryId:categoryId,
           catShow:catShow
         });
	} catch(err){
          console.log(err)
		    	req.flash("error", "something went wrong with fetching associated products");
		  		res.redirect("/");
       }
     });

// ajax call for pagination
router.get("/:slug/get-category/:page/:limit", async (req, res) => {
  const page = req.params.page
  const limit =req.params.limit

  const startIndex = (page - 1) * limit
  const endIndex = page * limit
   try{
    const resp = await Product.find().populate({"path": "category", match:{"slug":req.params.slug}}).sort({createdAt: 'desc'}).skip(parseInt(startIndex)).limit(parseInt(limit)).exec();
    const products = resp.filter(function(i){
          return i.category != null;
        });
    res.send(products);
      // res.render("book/landing", {
      //   books: books,
      //   searchOptions: req.query,
      // });
   } catch(error){
      if(error){
        console.log(error);
      }
   }
})


// ajax call for similar products on show page

router.get("/similar_products/:categoryId", async (req, res) => {
   try{
    const resp = await Product.find().populate({"path": "category", match:{"_id":req.params.categoryId}}).sort({createdAt: 'desc'}).skip(2).limit(12).exec();
    const products = resp.filter(function(i){
          return i.category != null;
        });
    res.send(products);
   } catch(error){
      if(error){
        console.log(error);
      }
   }
})

router.get("/:slug/edit", function(req, res){
  Category.findOne({"slug":req.params.slug}, function(err, category){

    if(err || !category){
      req.flash("error", "Category not found")
      res.redirect("/category");
    }else{
      res.render("category/edit", {cate : category});
    }
  })
 });

router.put("/:id", async (req, res) => {
     let category
    try{
       category = await Category.findById(req.params.id);
       category.name = req.body.name
         await category.save();
           res.redirect("/category");
    } catch (error){
      if(category == null){
        res.redirect("/")
      } else {
         req.flash("error", "error updating category");
         res.render("/category/new", {category:category});
      }
      
    }
 });

router.delete("/:id", async (req, res) => {
      let category
    try{
       category = await Category.findById(req.params.id);
         await category.remove();
           res.redirect("/category");
    } catch (error){
      if(category == null){
        res.redirect("/")
      } else {
         req.flash("error", "unable to delete category. Be sure category has no products!");
          res.redirect("/category");
      }
      
    }
 });




module.exports = router;

