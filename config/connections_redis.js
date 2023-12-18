const { createClient } = require("redis");

const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    },
});

client.on("ready", () => {
    console.log("Redis to ready");
});

// Kiểm tra kết nối Redis
client.on("connect", () => {
    console.log("Connected to Redis");
});

client.on("error", (error) => {
    console.error(error);
});

module.exports = client;
