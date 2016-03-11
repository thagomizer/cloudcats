'use strict';

const request = require('request');

let reddit = {
  getImageUrls: () => {
    return _getPosts().then((posts) => {
      return posts
        .filter((post) => {
          return post.data.preview.images.length > 0;
        })
        .map((post) => {
          return post.data.preview.images[0].source.url;
        });
      });
  }
}

function _getPosts() {
  return new Promise((resolve, reject) => {
    var options = {
      url: 'https://www.reddit.com/r/aww/hot.json',
      json: true,
      headers: {
        'User-Agent': 'justinbeckwith:cloudcats:v1.0.0 (by /u/justinblat)'
      }
    };

    request(options, (err, res, body) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(body.data.children);
      }
    });

  });
}

module.exports = reddit;