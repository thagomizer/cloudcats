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

const Hapi = require('hapi');
const path = require('path');
const relay = require('./catrelay');
const logger = require('./logger');

// Set up the server
const server = new Hapi.Server();
server.connection({
  host: '0.0.0.0',
  port: process.env.PORT || 8080
});

// Set up socket.io
const io = require('socket.io')(server.listener);

// configure plugins and routes
var plugins = [require('vision'), require('inert'), errors.hapi];
server.register(plugins, (err) => {
  if (err) {
      throw err;
  }

  // configure jade views
  server.views({
    engines: { pug: require('pug') },
    path: __dirname + '/templates',
    compileOptions: {
        pretty: true
    }
  });

  // set up static public handler
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'public'
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
      return reply.view('index');
    }
  });
});

// start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  logger.info('Server running at:', server.info.uri);

  // start listening for cats
  relay.listen(io);
});
