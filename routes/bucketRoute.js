const express = require("express");
const ctrlc = require("../controller/bucketCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
    "/create-buckets",
    [authMiddleware, isAdmin],
    ctrlc.createProductBuckets
);
router.get("/get-buckets", ctrlc.getProductBuckets);
module.exports = router;
