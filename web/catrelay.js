'use strict';

const logger = require('./logger');
const request = require('request');
const ioc = require('socket.io-client');

const apiEndpoint =
  process.env.NODE_ENV == 'production' ?
    'https://worker-dot-cloudcats-next.appspot.com':
    'http://localhost:8081';

// Create the subscription, and forward messages to the browser
const listen = (io, callback) => {
  // listen to socket.io for a new run request from the browser
  io.on('connection', (socket) => {
    socket.on('start', () => {
      makeRequest(socket);
    });
  });
};

/**
 * Create a new gRPC client.  Connect to the worker, and
 * analyze the stream of responses.
 */
function makeRequest(clientSocket) {
  try {
    logger.info(`Requesting a run on ${apiEndpoint}...`);
    let cnt = 0;
    const backendSocket = ioc(apiEndpoint)
      .on('error', error => {
        logger.error(error);
      })
      .on('disconnect', data => {
        logger.info(data);
      })
      .on('end', data => {
        logger.info('Analyze request complete.');
        clientSocket.emit('cloudcats', {
          type: 'FIN'
        })
      })
      .on('data', data => {
        logger.info('received data');
        cnt++;
        logger.info(data);
        logger.info(JSON.stringify(data));
        logger.info(`MESSAGE ${cnt}: ${data.type}`);
        clientSocket.emit('cloudcats', data);
      })
      .on('connect',  data => {
        logger.info('Connected to analysis server.');
        backendSocket.emit('analyze');
      });
  } catch (e) {
    logger.error("Error making RPC request");
    logger.error(e);
  }
}

var api = {
  listen: listen
}

module.exports = api;