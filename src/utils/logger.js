const pino = require("pino");

const logger = pino({
  level: "error", // IMPORTANT → only error logs

  timestamp: pino.stdTimeFunctions.isoTime,

  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});

module.exports = logger;
