const winston = require('winston');
const gcpTransport = require('@google-cloud/logging-winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console({
      handleExceptions: true
    }),
    new gcpTransport({
      keyFilename: 'keyfile.json',
      logName: 'cloudcats-worker'
    })
  ]
});

module.exports = logger;