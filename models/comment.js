const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
    text: {type: String, require:true},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        lastName: String
    },
    replies: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Reply"
                }
            ],
    createdAt: {
    	type:Date,
    	required: true,
    	default: Date.now
    }
});

module.exports = mongoose.model("Comment", commentSchema);