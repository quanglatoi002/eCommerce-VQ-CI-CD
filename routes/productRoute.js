const express = require("express");
const ctrlc = require("../controller/productCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const {
    requestLimitMiddleware,
} = require("../middlewares/requestLimitMiddleware");

const router = express.Router();

router.post("/", authMiddleware, isAdmin, ctrlc.createProduct);
router.get("/", requestLimitMiddleware, ctrlc.getAllProduct);
router.put("/wishlist", [authMiddleware, isAdmin], ctrlc.addToWishlist);
router.put("/rating", [authMiddleware, isAdmin], ctrlc.ratings);
router.get("/:id", ctrlc.getaProduct);
router.put("/:id", [authMiddleware, isAdmin], ctrlc.updateProduct);
router.delete("/:id", [authMiddleware, isAdmin], ctrlc.deleteProduct);

module.exports = router;
