const { RedisPubSub } = require("graphql-redis-subscriptions");
const Redis = require("ioredis");
require("dotenv").config();

const options = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? process.env.REDIS_PORT : "6379",
  password: process.env.REDIS_PASSWORD || "",
  retryStrategy: (times) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
  tls: {
    rejectUnauthorized: false,
  },
};
const NEW_USER = "new_user";

const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});

setTimeout(() => {
  console.log("event published");
  pubsub.publish(NEW_USER, {
    userRegistered: {
      id: 1,
      name: "wally",
    },
  });
}, 5000);
