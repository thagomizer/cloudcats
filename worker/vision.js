'use strict';

const request = require('request');
const uuid = require('node-uuid');
const util = require('util');
const gcloud = require('gcloud')({
  projectId: 'cloudcats-next',
  keyFilename: 'keyfile.json'
});

const vision = gcloud.vision();
const storage = gcloud.storage();
const bucket = storage.bucket('cloudcats-bucket');

var count = 0;

function annotate(url) {
  let promise = new Promise((resolve, reject) => {
    let name = uuid.v4();
    let file = bucket.file(name);
    var idx = count++;
    console.log('requesting ' + idx);
    request(url)
      .pipe(file.createWriteStream())
      .on('finish', () => {
        vision.detectLabels(file, (err, labels) => {
          if (err) {
            console.error("Error detecting labels: " + util.inspect(err));
            reject(err);
          }
          file.delete();
          resolve({
            url: url,
            labels: labels
          });
        });
      }).on('error', (err) => {
        console.error("Error requesting content: \n\t" + url + "\n\t" + util.inspect(err) + "\n\t" + err.stack);
        reject(err);
      });
    });
  return promise;
}

let api = {
  annotate: annotate
}

module.exports = api;