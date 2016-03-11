'use strict';

const reddit = require('./reddit');
const vision = require('./vision');
const util = require('util');
const gcloud = require('gcloud')({
  projectId: 'cloudcats-next',
  keyFilename: 'keyfile.json'
});

const pubsub = gcloud.pubsub();
const topicName = "picEvents";

function acquireTopic() {
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

function publishEvent(result, topic) {
  let type = 'other';

  if (result.type === 'fin') {
    type = 'fin';
  } else if (result.labels.indexOf('dog') > -1) {
    type = 'dog';
  } else if (result.labels.indexOf('cat') > -1) {
    type = 'cat';
  }
  
  let evt = {
    data: {
      url: result.url,
      type: type,
      total: result.total
    }
  };

  topic.publish(evt, function(err) {
    if (err) {
      console.error(`error publishing event: ${util.inspect(err)}`);
    } else {
      console.log(`event published: ${type}`);
    }
  });
  
}

function analyze() {

  let topicPromise = acquireTopic();
  let redditPromise = reddit.getImageUrls();

  Promise.all([topicPromise, redditPromise]).then((values) => {
    var topic = values[0];
    var urls = values[1];
    let promises = [];
    for (let url of urls) {
      let p = vision.annotate(url).then((result) => {
        publishEvent(result, topic);
      }).catch((err) => {
        console.log('Error publishing event:' + util.inspect(err));
      });
      promises.push(p);
    }
    Promise.all(promises).then(() => {
      // send a final event that lets the client know its done
      publishEvent({
        type: 'fin',
        total: promises.length
      }, topic);
    });
  }).catch((err) => {
    console.error('ERROR:' + util.inspect(err));
  });
}

module.exports = {
  analyze: analyze
};