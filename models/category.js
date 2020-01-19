const mongoose = require("mongoose");
const Product = require("./product");
const slug = require('mongoose-slug-updater');
 mongoose.plugin(slug);


const CategorySchema = new mongoose.Schema([
 {
 	name: {type:String, required:true},
 	slug: { type: String, slug: "name", slugPaddingSize: 4,  unique: true }
 }
 ]);

CategorySchema.pre("remove", function(next){
	Product.find({category: this.id}, (err, products) => {
			if(err){
				next(err);
			} else if(products.length > 0){
				next(new Error("This category has products still"));
			} else {
				next();
			}
	});
});

module.exports = mongoose.model("Category", CategorySchema);