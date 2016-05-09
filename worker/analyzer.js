'use strict';

const reddit = require('./reddit');
const vision = require('./vision');
const util = require('util');
const async = require('async');
const logger = require('./logger');
const gcloud = require('gcloud')({
  keyFilename: 'keyfile.json'
});

const pubsub = gcloud.pubsub();
const topicName = "picEvents";

function acquireTopic(callback) {
  pubsub.createTopic(topicName, (err, topic) => {
    if (err && err.code !== 409) {
      callback(err);
    } else {
      callback(null, pubsub.topic(topicName));
    }
  });
}

function publishEvent(result, topic, callback) {
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
      logger.error(`error publishing event: ${util.inspect(err)}\n\t${err.stack}`);
      return callback(err);
    } else {
      logger.info(`event published: ${type}`);
      callback(null, evt);
    }
  });
}

function analyze(callback) {
  logger.info("Starting to analyze!");
  let cnt = 0;

  // go get the topic and reddit posts in parallel
  async.parallel([(callback) => {
      // get topics
      acquireTopic((err, topic) => {
        if (err) {
          logger.error("Error acquiring topic: " + util.inspect(err));
          return callback(err);
        }
        callback(null, topic);
      });
    }, (callback) => {
      // get urls
      reddit.getImageUrls((err, urls) => {
        if (err) {
          logger.error("Error acquiring reddit urls: " + util.inspect(err));
          return callback(err);
        }
        callback(null, urls);
      });
    }
  ], (err, results) => {

    // we now have urls and the topic
    if (err) {
      logger.error("Error acquiring topic or urls: " + util.inspect(err));
      return callback(err);
    }
    logger.info('Received reddit posts and topic, starting classification.');

    let topic = results[0];
    let urls = results[1];
    
    // queue vision/pubsub jobs so we don't drown the connection
    var q = async.queue((url, callback) => {
      logger.info('processing ' + url);
      vision.annotate(url, (err, result) => {
        if (err) {
          logger.error('Error annotating image:' + util.inspect(err));
          return callback(err);
        }
        publishEvent(result, topic, (err, evt) => {
          if (err) {
            logger.error('Error publishing event:' + util.inspect(err));
            return callback(err);
          }
          cnt++;
          logger.info(`${cnt} objects complete`);
          callback(null);
        });
      });
    }, 15);

    q.push(urls);

    q.drain = () => {
      logger.info('***all items have been processed***');
      // send a final event that lets the client know its done
      publishEvent({
        type: 'fin',
        total: urls.length
      }, topic, (err, evt) => {
        if (err) {
          logger.error('Error publishing fin event: ' + util.inspect(err));
          return callback(err);
        }
        return callback();
      });
    }

  });
}

module.exports = {
  analyze: analyze
};
