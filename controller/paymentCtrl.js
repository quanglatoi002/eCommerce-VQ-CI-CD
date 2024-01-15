const Razarpay = require("razorpay");
const crypto = require("crypto");
const axios = require("axios");

const instance = new Razarpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

const checkout = async (req, res) => {
    const { amount } = req.body;
    const option = {
        amount: amount * 100 + 5,
        currency: "INR",
        receipt: "receipt_order_74394",
    };
    const order = await instance.orders.create(option);
    res.json({
        success: true,
        order,
    });
};

const paymentVerification = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId } = req.body;
    res.json({
        razorpayOrderId,
        razorpayPaymentId,
    });
};

//momo
const makePayment = async (req, res) => {
    const { amount } = req.body;
    if (!amount) throw new Error("amount is required");
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const requestId = partnerCode + new Date().getTime();
    const orderId = requestId;
    const orderInfo = `Thanh toan hoa don ${orderId}`;
    const redirectUrl = "https://momo.vn/return";
    const ipnUrl = "https://callback.url/notify";
    const requestType = "captureWallet";
    const extraData = "";

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto
        .createHmac("sha256", secretKey)
        .update(rawSignature)
        .digest("hex");

    const requestBody = {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: "vi",
    };

    try {
        const response = await axios.post(
            "https://test-payment.momo.vn/v2/gateway/api/create",
            requestBody
        );
        console.log(response);
        res.json({ payUrl: response.data.payUrl });
    } catch (error) {
        console.error("Error creating payment:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    checkout,
    paymentVerification,
    makePayment,
};
