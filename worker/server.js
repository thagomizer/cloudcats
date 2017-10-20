'use strict';

require('@google-cloud/trace-agent').start({
  keyFilename: './keyfile.json'
});

require('@google-cloud/debug-agent').start({
  allowExpressions: true,
  keyFilename: './keyfile.json'
});

const analyzer = require('./analyzer');
const logger = require('./logger');

const app = require('http').createServer(() => {});
const io = require('socket.io')(app);

app.listen(process.env.PORT || 8081);

io.on('connection', socket => {
  logger.info("Connect established.");
  socket.on('analyze', data => {
    logger.info("Received analyze request");
    analyzer.analyze(socket)
    .then(result => {
      logger.info("Request complete. Ending streaming response.");
      socket.emit('end');
    }).catch(err => {
      logger.error('Error analyzing reddit');
      logger.error(err);
      socket.emit('end');
    });
  });
}).on('error', err => {
  logger.error('Error establishing connection.');
  logger.error(err);
});