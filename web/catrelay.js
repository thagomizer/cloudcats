'use strict';

const nconf = require('nconf');
const util = require('util');
const logger = require('./logger');
const request = require('request');
const pubsub = require('@google-cloud/pubsub')({
  keyFilename: './keyfile.json'
});

const topicName = "picEvents";
const subName = "picSub";

// set up index page handler
const apiEndpoint = 
  process.env.NODE_ENV == 'production' ? 
    'http://cloudcats-worker:8081/go' :
    'http://localhost:8081/go';

// Configure nconf for reading environment variables
nconf.argv().env().file({
  file: 'secrets.json'
});

// Create or acquire a reference to a pub/sub topic
const acquireTopic = (callback) => {
  pubsub.createTopic(topicName, function(err, topic) {
  if (err && err.code !== 409) {
      callback(err);
    } else {
      callback(null, pubsub.topic(topicName));
    }
  });
}

// Create or acquire a reference to a pub/sub subscription
const acquireSubscription = (topic, callback) => {
  topic.subscribe(subName, function(err, subscription) {
    if (err) {
      logger.error("Error acquiring subscription: " + util.inspect(err));
      return callback(err);
    } else {
      callback(null, subscription);
    }
  });
}

// Create the subscription, and forward messages to the browser
const listen = (io, callback) => {
  
  // listen to socket.io for a new run request from the browser
  io.on('connection', (socket) => {
    socket.on('start', () => {
      logger.info(`Requesting a run on ${apiEndpoint}...`);
      request(apiEndpoint, (err, res, body) => {
        if (err) {
          logger.error(err);
        }
        logger.info('Request for data complete.');
      })
    });
  });

  acquireTopic((err, topic) => {
    if (err) {
      logger.error("Error acquiring topic: " + util.inspect(err));
    }
    acquireSubscription(topic, (err, subscription) => {
      if (err) {
        logger.error("Error acquiring subscription: " + util.inspect(err));
        return callback(err);
      }
      subscription.on('message', (message) => {
        //logger.info('MESSAGE: ' + util.inspect(message));
        io.emit('cloudcats', message);
      });
      logger.info('listening to sub');
    });
  });
};


var api = {
  listen: listen
}

module.exports = api;
