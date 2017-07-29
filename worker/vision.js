'use strict';

const request = require('request');
const uuid = require('uuid/v4');
const util = require('util');
const logger = require('./logger');
const gcperror = require('./gcperror');
const gconf = {
  keyFilename: 'keyfile.json'
};
const vision = require('@google-cloud/vision')(gconf);
const storage = require('@google-cloud/storage')(gconf);
const bucket = storage.bucket('cloudcats-bucket');

var count = 0;

async function annotate(url) {
  const name = uuid();
  const file = bucket.file(name);
  return new Promise((resolve, reject) => {
    request(url)
      .pipe(file.createWriteStream())
      .on('finish', () => {
        vision.detectLabels(file, (err, labels) => {
          if (err) {
            logger.error("Error detecting labels");
            gcperror.dig(err);
            return reject(err);
          }
          file.delete();
          resolve({
            url: url,
            labels: labels
          });
        });
      }).on('error', err => {
        logger.error("Error requesting content: \n\t" + url + "\n\t" + util.inspect(err) + "\n\t" + err.stack);
        reject(err);
      });
  });
}

let api = {
  annotate: annotate
}

module.exports = api;