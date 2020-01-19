const mongoose = require("mongoose");

const replySchema = mongoose.Schema({
    text: {type: String, require:true},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        lastName: String
    },
    createdAt: {
    	type:Date,
    	required: true,
    	default: Date.now
    }
});

module.exports = mongoose.model("Reply", replySchema);