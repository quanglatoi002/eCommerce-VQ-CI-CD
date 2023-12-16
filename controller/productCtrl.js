const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");
const DatabaseFacade = require("../utils/patterns");
const Size = require("../models/SizeModel");

const createProduct = asyncHandler(async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res
                .status(400)
                .json({ message: "Bad Request - Empty data" });
        }
        // check seen a data size send?
        if (req.body.sizes && req.body.sizes.length > 0) {
            // có thể sẽ có 3 loại size S M L XL ...
            const newSizes = await Promise.all(
                req.body.sizes.map((sizeData) => Size.create(sizeData))
            );

            // add newSizes vào product
            req.body.sizes = newSizes.map((size) => size._id);
        }

        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    } catch (error) {
        throw new Error(error);
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const updateProduct = await Product.findOneAndUpdate(
            { _id: id },
            req.body,
            {
                new: true,
            }
        );
        console.log(updateProduct);
        res.json(updateProduct);
    } catch (error) {
        throw new Error(error);
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const deleteProduct = await Product.findByIdAndDelete(id);
        res.json(deleteProduct);
    } catch (error) {
        throw new Error(error);
    }
});

const getaProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const findProduct = await DatabaseFacade.getProductById(id);
        res.json(findProduct);
    } catch (error) {
        throw new Error(error);
    }
});

const getAllProduct = asyncHandler(async (req, res) => {
    try {
        //filtering
        const queryObj = { ...req.query };
        const excludeFields = ["page", "sort", "limit", "fields"];
        console.log(queryObj);
        excludeFields.forEach((e) => delete queryObj[e]);
        //chuyển sang JSON để phù hợp với $gte
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );

        console.log(queryStr);

        let query = Product.find(JSON.parse(queryStr));

        //sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }

        //Limiting the fields

        if (req.query.fields) {
            const fields = req.query.fields.split(",").join(" ");
            query = query.select(fields);
        } else {
            query = query.select("-__v");
        }

        //pagination
        const page = +req.query.page;
        const limit = +req.query.limit;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
        if (req.query.page) {
            const productCount = await Product.countDocuments();
            if (skip >= productCount)
                throw new Error("This Page does not exist");
        }
        console.log(page, limit, skip);
        const product = await query;
        res.json(product);
    } catch (error) {
        throw new Error(error);
    }
});

const addToWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { prodId } = req.body;
    try {
        const user = await User.findById(_id);
        const alreadyAdded = user?.wishlist?.includes(prodId);
        if (alreadyAdded) {
            let user = await User.findByIdAndUpdate(
                _id,
                {
                    $pull: { wishlist: prodId },
                },
                { new: true }
            );
            return res.json(user);
        } else {
            let user = await User.findByIdAndUpdate(
                _id,
                {
                    $push: { wishlist: prodId },
                },
                { new: true }
            );
            return res.json(user);
        }
    } catch (error) {
        throw new Error(error);
    }
});

//RATINGS
const ratings = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, prodId, comment } = req.body;
    if (!star || !prodId) throw new Error("Missing input");

    try {
        const product = await Product.findById(prodId);
        let alreadyRated = product.ratings.find(
            (userId) => userId?.postedBy.toString() === _id.toString()
        );
        //update star & cm
        //$elemMatch đc sử dụng để tìm các tài liệu trong 1 mảng sao cho 1 || nhiều điều kiện được xác định, thường dùng như mảng các đối tượng hoặc mảng các giá trị
        if (alreadyRated) {
            await Product.updateOne(
                {
                    ratings: { $elemMatch: alreadyRated },
                },
                // $ ở đây là đại diện cho phần tử mà bạn đã tìm thấy qua đk truy vấn
                {
                    $set: {
                        "ratings.$.star": star,
                        "ratings.$.comment": comment,
                    },
                },
                { new: true }
            );
        } else {
            await Product.findByIdAndUpdate(
                prodId,
                {
                    $push: {
                        ratings: {
                            star,
                            comment,
                            postedBy: _id,
                        },
                    },
                },
                { new: true }
            );
        }
        const getAllRatings = await Product.findById(prodId);
        let totalRating = getAllRatings?.ratings.length;
        let ratingSum = getAllRatings?.ratings
            .map((item) => item.star)
            .reduce((prev, curr) => prev + curr, 0);
        let actualRating = Math.round(ratingSum / totalRating);
        let finalProduct = await Product.findByIdAndUpdate(
            prodId,
            { totalRatings: actualRating },
            { new: true }
        );
        res.json(finalProduct);
    } catch (error) {
        throw new Error(error);
    }
});

module.exports = {
    createProduct,
    getaProduct,
    getAllProduct,
    updateProduct,
    deleteProduct,
    addToWishlist,
    ratings,
};
