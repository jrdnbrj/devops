import { createClient } from "redis";

export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect();
