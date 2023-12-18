const mongoose = require("mongoose");

const bucketSchema = new mongoose.Schema({
    minPrice: Number,
    maxPrice: Number,
    products: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Product",
        },
    ],
});

module.exports = mongoose.model("Bucket", bucketSchema);
