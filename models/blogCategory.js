const mongoose = require("mongoose");
const Blog = require("./blog");
const slug = require('mongoose-slug-updater');
 mongoose.plugin(slug);

const CategorySchema = new mongoose.Schema([
 {
 	name: {type:String, required:true},
 	slug: { type: String, slug: "name", slugPaddingSize: 4,  unique: true }
 }
 ]);

CategorySchema.pre("remove", function(next){
	Blog.find({category: this.id}, (err, blogs) => {
			if(err){
				next(err);
			} else if(blogs.length > 0){
				next(new Error("This category has blogs still"));
			} else {
				next();
			}
	});
});

module.exports = mongoose.model("Blog_Category", CategorySchema);