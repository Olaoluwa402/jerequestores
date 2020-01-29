if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const cookieParser =require("cookie-parser");
const csrf = require('csurf');
const bodyParser = require("body-parser");
const mongoose    = require("mongoose");
const  flash       = require("connect-flash");
const { check, validationResult } = require('express-validator');
 const    expressSanitizer = require("express-sanitizer");
const session    = require("express-session");
const passport    = require("passport");
const LocalStrategy = require("passport-local").Strategy; 
const MongoStore = require('connect-mongo')(session);
const methodOverride = require("method-override");
const    User        = require("./models/users");
const Category = require("./models/category");
const Blog_Category = require("./models/blogCategory");
const Product = require("./models/product");
const Review = require("./models/review");
const Blog   = require("./models/blog");
const Comment  = require("./models/comment");
const Reply  = require("./models/reply");
// const Rating = require("./models/rating");


const indexRoutes      = require("./routes/index");
const categoryRoutes  = require("./routes/category");
const  reviewRoutes  = require("./routes/review");
const  productRoutes  = require("./routes/product");
const shoppingRoutes     = require("./routes/shopping"); 
const  blogRoutes     = require("./routes/blog"); 
const blogCategoryRoutes  = require("./routes/blogCategory");
const commentRoutes    = require("./routes/comment");
const replyCommentsRoutes = require("./routes/replies");






 const url = process.env.DATABASE_URL || "mongodb://localhost:27017/jerequeStore3";
mongoose.connect(url, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false },  function(err){
	if (err){
		console.error('system could not connect to mongo server.');
		console.log(err);
	} else{
		console.log('Data base connection successful!');
	}
});

// require the config passport 
 require('./config/passport')(passport);

// app sets and use
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
app.use(cookieParser());
app.use(expressSanitizer());
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
// app.set('view', path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.set("layout", "layouts/layout");
app.use(expressLayouts);



//require moment
app.locals.moment = require('moment');


// PASSPORT CONFIGURATION
app.use(session({
    secret: "here we go again!", 
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {maxAge: 180*60*1000}
    // 180min i.e 3hrs
}));


app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
 // passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
app.locals.moment = require('moment');

app.use(csrf());
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.session = req.session;
   res.locals.csrfToken = req.csrfToken();
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});



app.use("/", indexRoutes);
app.use("/category", categoryRoutes);
app.use("/shop", shoppingRoutes);
app.use("/products",  productRoutes);
app.use("/products/:slug/reviews", reviewRoutes);

app.use("/blog", blogRoutes);
app.use("/blog-category", blogCategoryRoutes);
app.use("/blog/:slug/comments", commentRoutes);
app.use("/blog/:slug/comments/:comment_id/replies", replyCommentsRoutes);




app.use((req, res, next) => {
  const err = new Error('Page Not found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
        res.status(err.status || 500);
        const status = err.status || 500;
        const message = err.message;
        // console.log(stutus);
     // res.send({
     //    error: {
     //      status: err.staus || 500,
     //      message: err.meaasge
     //    }
     // });
  res.render("page_404", {
      status:status || 500,
      message:message
  });
});


// connect port

let port = process.env.PORT;
if(port == null || port == " "){
    port = 3000;
}

app.listen(port, function(){
   console.log("Your JereQue Store Server Has Started!");
});
