'use strict';

const Hapi = require('hapi');
const nconf = require('nconf');
const path = require('path');
const favicon = require('serve-favicon');
const gcloud = require('gcloud');

// Configure nconf for reading environment variables
nconf.argv().env().file({
    file: 'secrets.json'
});

// Set up pubnub 
const pubnub = require("pubnub")({
    ssl: true,
    publish_key: nconf.get('pubnub_publish_key'),
    subscribe_key: nconf.get('pubnub_subscribe_key')
});

// Set up the server
const server = new Hapi.Server();
server.connection({ 
  host: '0.0.0.0', 
  port: process.env.PORT || 8080 
});

// Handler for the / page
const indexHandler = (request, reply) => {
  return reply.view('index', {
    subscribeKey: nconf.get('pubnub_subscribe_key')
  });
}

// configure templating
server.register(require('vision'), (err) => {
    if (err) {
        throw err;
    }
    server.views({
        engines: { jade: require('jade') },
        path: __dirname + '/views',
        compileOptions: {
            pretty: true
        }
    });
    server.route({ method: 'GET', path: '/', handler: indexHandler });
});

// start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
