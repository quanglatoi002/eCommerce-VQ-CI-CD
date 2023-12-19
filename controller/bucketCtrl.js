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

        // if (!minPrice || !maxPrice)
        //     throw new Error("Invalid minPrice or maxPrice");
        console.log(minPrice);

        const maxPriceBucket = 5000; // Giả sử giá sản phẩm từ 0 đến 1000
        const numberOfBuckets = 10; // Số lượng bucket (khoảng giá) bạn muốn chia dữ liệu thành

        const resultBuckets = +(maxPriceBucket / numberOfBuckets);

        // nếu user chỉ nhập minPrice mà ko nhập đơn giá thì code sẽ sai
        // const buckets = await Bucket.find({
        //     minPrice: { $gte: minPrice },
        //     maxPrice: { $lte: maxPrice },
        // });

        // minPrice
        const searchPrice = {};

        // min = 300 thì nó sẽ lấy bd từ 500-1000 mà không luôn vị trí ở ngay nó
        if (minPrice) {
            searchPrice.minPrice = { $gte: minPrice - resultBuckets };
        }
        // 900 + 500 -> mốc 1k
        //400 + 500 -> 500
        if (maxPrice) {
            searchPrice.maxPrice = { $lt: Number(maxPrice) + resultBuckets };
        }

        console.log(searchPrice.maxPrice);

        // tìm bucket
        const buckets = await Bucket.find(searchPrice);

        console.log("bucket", buckets);
        if (!buckets || buckets.length === 0) {
            return res
                .status(404)
                .json({ message: "No products found for the given price" });
        }

        // nếu bucket nhiều sản phẩm
        const productIds = buckets.reduce((acc, bucket) => {
            acc.push(...bucket.products);
            return acc;
        }, []);
        console.log(productIds);

        const products = await Product.find({ _id: { $in: productIds } });

        res.json(products);
    } catch (error) {
        console.error(error);
    }
});

module.exports = {
    createProductBuckets,
    getProductBuckets,
};
