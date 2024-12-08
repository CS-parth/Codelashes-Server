const { isRedisWorking, requestToKey, readData, writeData } = require('../db/redis');

function redisCache(
    options = {
      EX: 604800 // 7 days
    }
  ) {
    return async (req, res, next) => {
      if (isRedisWorking()) {
        const key = requestToKey(req);
        const cachedValue = await readData(key);
        if (cachedValue) {
          try {
            return res.json(JSON.parse(cachedValue));
          } catch {
            return res.send(cachedValue);
          }
        } else {
          const oldSend = res.send;
          res.send = function (data) {
            res.send = oldSend;
  
            if (res.statusCode.toString().startsWith("2")) {
              writeData(key, data, options).then();
            }
  
            return res.send(data);
          };
  
          next();
        }
      } else {
        next();
      }
    };
  }


  module.exports = redisCache;