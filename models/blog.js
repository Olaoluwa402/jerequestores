const mongoose = require("mongoose");
const slug = require('mongoose-slug-updater');
 mongoose.plugin(slug);

// SCHEMA SETUP
    var blogSchema = new mongoose.Schema({
        title: {type:String, required:true},
        slug: { type: String, slug: "title", slugPaddingSize: 4,  unique: true },
        body: {type:String, required:true},
        image: {type:String, required:true},
        imageId: String,
        likes:Number,
        author: {
           id: {
               type: mongoose.Schema.Types.ObjectId,
               ref: 'User'
           },
           name: String,
          },
         comments: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Comment"
                }
            ],
         category:{
          type: mongoose.Schema.Types.ObjectId,
          required:true,
          ref: "Blog_Category",
          name: String
        },
        createdAt:  {type: Date, default: Date.now}
     });
module.exports = mongoose.model("Blog", blogSchema);