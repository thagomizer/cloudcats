'use strict';

const nconf = require('nconf');
const util = require('util');
const logger = require('./logger');
const gcloud = require('gcloud');({
  keyFilename: 'keyfile.json'
});

const pubsub = gcloud.pubsub();
const topicName = "picEvents";
const subName = "picSub";

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
  topic.subscribe(subName, {
    autoAck: true,
    reuseExisting: true
  }, function(err, subscription) {
    if (err) {
      logger.error("Error acquiring subscription: " + util.inspect(err));
      return callback(err);
    } else {
      callback(null, subscription);
    }
  });
}

// Create the subscription, and forward messages to the browser
const listen = (callback) => {
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
        logger.info('MESSAGE: ' + util.inspect(message));
        pubnub.publish({
          channel: 'cloudcats',        
          message: message,
          callback : (m) => { logger.info(m) }
        });
      });
      logger.info('listening to sub');
    });
  });
};


var api = {
  listen: listen
}

module.exports = api;
