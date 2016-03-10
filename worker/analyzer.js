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
const subName = "picSub";

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

function acquireSubscription(topic) {
  let promise = new Promise((resolve, reject) => {
    topic.subscribe(subName, {
      autoAck: true,
      reuseExisting: true
    }, function(err, subscription) {
      if (err) {
        reject(err);
      } else {
        subscription.on('message', function(message) {
          console.log('MESSAGE: ' + message.data);
        });
        console.log('listening to sub');
        resolve(subscription);
      }
    });
  });
  return promise;
}

function analyze() {
  
  acquireTopic().then((topic) => {
    acquireSubscription(topic).then((sub) => {
      console.log('GOT THE SUB!');
    });

    reddit.getImageUrls().then((urls) => {
      let dogs = 0;
      let cats = 0;
      let promises = [];
      for (let url of urls) {
        let p = vision.annotate(url).then((result) => {
          let type = 'none';
          if (result.labels.indexOf('dog') > -1) {
            dogs++;
            type = 'dog';
          } else if (result.labels.indexOf('cat') > -1) {
            cats++;
            type = 'cat';
          }

          if (type === 'dog' || type === 'cat') {
            console.log(`it's a ${type}!`);
            var evt = {
              data: {
                url: url,
                type: type,
                dogCount: dogs,
                catCount: cats
              }
            };
            console.log('I AM PUBLISHING AN EVENT');
            topic.publish(evt, function(err) {
              console.log('hello?');
              if (err) {
                console.error(`error publishing event: ${util.inspect(err)}`);
              } else {
                console.log(`event published: ${url}`);
              }
            });
          }

        }).catch((err) => {
          console.log('Error publishing event:' + util.inspect(err));
        });
        promises.push(p);
      }
      Promise.all(promises).then(() => {
        console.log(`dogs: ${dogs} / cats: ${cats}`);
      });
    });
  }).catch((err) => {
    console.error('ERROR:' + util.inspect(err));
  });
}

module.exports = {
  analyze: analyze
};