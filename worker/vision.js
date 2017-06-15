'use strict';

const request = require('request');
const uuid = require('node-uuid');
const util = require('util');
const logger = require('./logger');
const gconf = {
  keyFilename: 'keyfile.json'
};
const vision = require('@google-cloud/vision')(gconf);
const storage = require('@google-cloud/storage')(gconf);
const bucket = storage.bucket('cloudcats-bucket');

var count = 0;

function annotate(url, callback) {

  let name = uuid.v4();
  let file = bucket.file(name);
  var idx = count++;
  request(url)
    .pipe(file.createWriteStream())
    .on('finish', () => {
      vision.detectLabels(file, (err, labels) => {
        if (err) {
          logger.error("Error detecting labels: " + util.inspect(err));
          return callback(err);
        }
        file.delete();
        callback(null, {
          url: url,
          labels: labels
        });
      });
    }).on('error', (err) => {
      logger.error("Error requesting content: \n\t" + url + "\n\t" + util.inspect(err) + "\n\t" + err.stack);
      return callback(err);
    });
}

let api = {
  annotate: annotate
}

module.exports = api;