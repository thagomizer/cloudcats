const winston = require('winston');

// configure the logger
require('winston-gae');
var logger = new winston.Logger({
  levels: winston.config.GoogleAppEngine.levels,
  transports: [
    new winston.transports.Console({
      handleExceptions: true
    }),
    new winston.transports.GoogleAppEngine()
  ]
});

module.exports = logger;