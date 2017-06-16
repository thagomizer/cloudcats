'use strict';

require('@google-cloud/trace-agent').start({
  keyFilename: './keyfile.json'
});

require('@google-cloud/debug-agent').start({ 
  allowExpressions: true,
  keyFilename: './keyfile.json'
});

const errors = require('@google-cloud/error-reporting')({
  keyFilename: './keyfile.json'
});

const request = require('request');
const Hapi = require('hapi');
const analyzer = require('./analyzer');
const logger = require('./logger');

const server = new Hapi.Server();
server.connection({ 
  host: '0.0.0.0', 
  port: process.env.PORT || 8081 
});

server.route({
  method: 'GET',
  path:'/go', 
  handler: (request, reply) => {
    analyzer.analyze((err) => {
      return reply('OK!');
    });
  }
});

server.route({
  method: 'GET',
  path: '/error',
  handler: (request, reply) => {
    throw new Error('This is a bug!');
  }
});

// configure error reporting
server.register(
  { 
    register: errors.hapi
  }, (err) => {
    if (err) {
      logger.error("There was an error in registering the error handling plugin", err);
    }
  }
);

server.start((err) => {
    if (err) {
        throw err;
    }
    logger.info('Server running at:', server.info.uri);
});
