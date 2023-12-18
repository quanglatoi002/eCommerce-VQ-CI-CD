const Product = require("../models/productModel");
const Bucket = require("../models/bucketModel");

const asyncHandler = require("express-async-handler");

const createProductBuckets = asyncHandler(async (req, res) => {
    const minPrice = 0;
    const maxPrice = 5000; // Giả sử giá sản phẩm từ 0 đến 1000
    const numberOfBuckets = 10; // Số lượng bucket (khoảng giá) bạn muốn chia dữ liệu thành
    const bucketSize = (maxPrice - minPrice) / numberOfBuckets;
    try {
        // = 0 + 0 * 500 => min = 0
        // = 0 + (0 + 1) * 500 => max = 500
        // = 0 + 1 * 500 => min = 500
        // = 0 + (1 + 1) * 500 => max = 1000
        for (let i = 0; i < numberOfBuckets; i++) {
            const bucketMinPrice = minPrice + i * bucketSize;
            const bucketMaxPrice = minPrice + (i + 1) * bucketSize;
            // check xem bucket đã tồn tại chưa?
            const existingBucket = await Bucket.findOne({
                minPrice: bucketMinPrice,
                maxPrice: bucketMaxPrice,
            }).lean();

            console.log("đã tồn tại", existingBucket);

            if (existingBucket) {
                //Nếu đã có bucket thì update lại
                // check lại price của product
                const productsInBucket = await Product.find({
                    price: { $gte: bucketMinPrice, $lt: bucketMaxPrice },
                });
                const productIds = productsInBucket?.map(
                    (product) => product._id
                );
                console.log(productIds);
                // update lại
                await Bucket.findOneAndUpdate(
                    { minPrice: bucketMinPrice, maxPrice: bucketMaxPrice },
                    { $set: { products: productIds } },
                    { new: true } // Trả về bản ghi sau khi cập nhật
                );
            } else {
                //find những tk có  price nằm trg khoảng đó
                const productsInBucket = await Product.find({
                    price: { $gte: bucketMinPrice, $lt: bucketMaxPrice },
                });

                // Lưu trữ ObjectId của sản phẩm vào bucket tương ứng
                // lấy ra id của từng sp
                const productIds = productsInBucket?.map(
                    (product) => product._id
                );
                // bucket pattern
                await Bucket.create({
                    minPrice: bucketMinPrice,
                    maxPrice: bucketMaxPrice,
                    products: productIds,
                });
            }
        }
        res.status(200).json({
            message: "Buckets created or update successfully",
        });
    } catch (error) {
        throw new Error(error);
    }
});

const getProductBuckets = asyncHandler(async (req, res) => {
    try {
        const { minPrice, maxPrice } = req.query;
        // tìm bucket
        const bucket = await Bucket.find({
            minPrice: { $lte: minPrice },
            maxPrice: { $gt: maxPrice },
        });

        if (!bucket) {
            return res
                .status(404)
                .json({ message: "No products found for the given price" });
        }

        const products = await Product.find({ _id: { $in: bucket.products } });

        res.json(products);
    } catch (error) {}
});

module.exports = {
    createProductBuckets,
    getProductBuckets,
};
