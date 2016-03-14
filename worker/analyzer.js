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
    pubsub.createTopic(topicName, (err, topic) => {
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
  return new Promise((resolve, reject) => {
    let type = 'other';

    if (result.type === 'fin') {
      type = 'fin';
    } else {
      let containsDog = result.labels.indexOf('dog') > -1;
      let containsCat = result.labels.indexOf('cat') > -1;

      if (containsCat && !containsDog) {
        type = 'cat';
      } else if (containsDog && !containsCat) {
        type = 'dog';
      } else if (containsCat && containsDog) {
        type = 'both';
      }
    }

    let evt = {
      data: {
        url: result.url,
        type: type,
        total: result.total
      }
    };

    topic.publish(evt, (err) => {
      if (err) {
        console.error(`error publishing event: ${util.inspect(err)}\n\t${err.stack}`);
        reject(err);
      } else {
        console.log(`event published: ${type}`);
        resolve(evt);
      }
    });
  });
}

function analyze() {
  let topicPromise = acquireTopic();
  let redditPromise = reddit.getImageUrls();

  Promise.all([topicPromise, redditPromise]).then((values) => {
    let topic = values[0];
    let urls = values[1];
    let promises = [];
    for (let url of urls) {
      let p = vision.annotate(url).then((result) => {
        return publishEvent(result, topic);
      }).catch((err) => {
        console.error('Error annotating event:' + util.inspect(err));
      });
      promises.push(p);
    }
    Promise.all(promises).then(() => {
      // send a final event that lets the client know its done
      publishEvent({
        type: 'fin',
        total: promises.length
      }, topic).catch((err) => {
        console.error('Error publishing fin event: ' + util.inspect(err));
      });
    });
  }).catch((err) => {
    console.error('Error processing images: ' + util.inspect(err));
  });
}

module.exports = {
  analyze: analyze
};
