'use strict';

const nconf = require('nconf');
const util = require('util');
const gcloud = require('gcloud')({
  projectId: 'cloudcats-next',
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
const acquireTopic = () => {
  let promise = new Promise((resolve, reject) => {
    pubsub.createTopic(topicName, function(err, topic) {
      if (err && err.code !== 409) {
        reject(err);
      } else {
        resolve(pubsub.topic(topicName));
      }
    });
  });
  return promise;
}

// Create or acquire a reference to a pub/sub subscription
const acquireSubscription = (topic) => {
  let promise = new Promise((resolve, reject) => {
    topic.subscribe(subName, {
      autoAck: true,
      reuseExisting: true
    }, function(err, subscription) {
      if (err) {
        reject(err);
      } else {
        resolve(subscription);
      }
    });
  });
  return promise;
}

// Create the subscription, and forward messages to the browser
const listen = () => {
  return acquireTopic().then((topic) => {
    return acquireSubscription(topic).then((subscription) => {
      subscription.on('message', (message) => {
        console.log('MESSAGE: ' + util.inspect(message));
        pubnub.publish({
          channel: 'cloudcats',        
          message: message,
          callback : (m) => { console.log(m) }
        });
      });
      console.log('listening to sub');
    });
  }).catch((err) => {
    console.error("Error acquiring topic: " + util.inspect(err));
  });
};


var api = {
  listen: listen
}

module.exports = api;
