'use strict';

const request = require('request');
const uuid = require('node-uuid');
const gcloud = require('gcloud')({
  projectId: 'cloudcats-next',
  keyFilename: 'keyfile.json'
});

const vision = gcloud.vision();
const storage = gcloud.storage();
const bucket = storage.bucket('cloudcats-bucket');

function annotate(url) {
  var promise = new Promise((resolve, reject) => {
    let name = uuid.v4();
    let file = bucket.file(name);
    request(url)
      .pipe(file.createWriteStream())
      .on('finish', () => {
        vision.detectLabels(file, function(err, labels) {
          if (err) console.error(err);
          file.delete();
          resolve({
            url: url,
            labels: labels
          });
        });
      });
    });
  return promise;
}

var api = {
  annotate: annotate
}

module.exports = api;