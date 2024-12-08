const { createClient } = require("redis");
const hash = require("object-hash");
require("dotenv").config();

exports.initializeRedisClient = async () => {
    let redisURL = (process.env.NODE_ENV === 'production') ? process.env.REDIS_URL : "redis://redis:6379";

    if (redisURL) {
      redisClient = createClient({ url: redisURL }).on("error", (e) => {
          console.error(`Failed to create the Redis client with error:`);
          console.error(e);
        });
        
      try {
        await redisClient.connect();
        console.log(`Connected to Redis successfully!`);
      } catch (e) {
        console.error(`Connection to Redis failed with error:`);
        console.error(e);
      }
    }
  }

  exports.requestToKey = (req) => {
    const reqDataToHash = {
      query: req.query,
      body: req.body,
    };
    // Path is given to give it some meaning when seen as a hashed value
    return `${req.path}@${hash.sha1(reqDataToHash)}`;
  }

  exports.isRedisWorking = () => {
    return !!redisClient?.isOpen;
  }

  exports.writeData = async (key, data, options)=>{
    if (!!redisClient?.isOpen) {
      try {
        // write data to the Redis cache
        await redisClient.set(key, data, options);
      } catch (e) {
        console.error(`Failed to cache data for key=${key}`, e);
      }
    }
  }

  exports.readData = async (key)=>{
    let cachedValue = undefined;
  
    if (!!redisClient?.isOpen) {
      // try to get the cached response from redis
      cachedValue = await redisClient.get(key);
      if (cachedValue) {
          return cachedValue;
      }
    }
  }