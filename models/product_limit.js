const mongoose = require("mongoose");
const productLimitSchema = new mongoose.Schema({
    product_limit: {type: String}
 });
module.exports = mongoose.model("ProductLimit", productLimitSchema);