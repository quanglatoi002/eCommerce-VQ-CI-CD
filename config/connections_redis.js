const { createClient } = require("redis");

const client = createClient({
    socket: {
        host: "redis-15002.c274.us-east-1-3.ec2.cloud.redislabs.com",
        port: 15002,
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
