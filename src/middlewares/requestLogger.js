const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {
  req.log = logger.child({
    method: req.method,
    url: req.originalUrl,
    payload: req.body,
  });

  next();
};

module.exports = requestLogger;
