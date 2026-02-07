const logger = require("./logger");

const successResponse = (
  res,
  status = 200,
  message = "SUCCESS",
  data = null,
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, status = 400, message = "ERROR", error = null) => {
  const log = res.req.log;
  const errObj = error || new Error(message);
  log.error({
    message,
    status,
    stack: errObj?.stack,
  });

  return res.status(status).json({
    success: false,
    message,
  });
};

module.exports = { successResponse, errorResponse };
