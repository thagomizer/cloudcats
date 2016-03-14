'use strict';

const request = require('request');
const util = require('util');

let reddit = {
  getImageUrls: () => {
    console.log("Request data from reddit...");
    return new Promise((resolve, reject) => {
      let allPosts = [];
      let currentPromise = Promise.resolve(null);
      for (let i=0; i<5; i++) {
        currentPromise = currentPromise.then((after) => {
          return _getPage(after).then((page) => {
            Array.prototype.push.apply(allPosts, 
              page.children.filter((post) => {
                return post.data &&
                        post.data.preview &&
                        post.data.preview.images &&
                        post.data.preview.images.length > 0;
              })
              .map((post) => {
                return post.data.preview.images[0].source.url;
              }));
            return page.after;
          }).catch((err) => {
            console.error("Error processing page of reddit posts: " + util.inspect(err));
          });
        }).catch((err) => {
          console.error("Error getting page of reddit posts: " + util.inspect(err));
        });
      }
      currentPromise.then(() => {
        console.log('Reddit data request complete: ' + allPosts.length);
        resolve(allPosts);
      });
    });
  }
}

function _getPage(after) {
  return new Promise((resolve, reject) => {
    let options = {
      url: 'https://www.reddit.com/r/aww/hot.json',
      json: true,
      headers: {
        'User-Agent': 'justinbeckwith:cloudcats:v1.0.0 (by /u/justinblat)'
      },
      qs: {
        after: after
      }
    };

    request(options, (err, res, body) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(body.data);
      }
    });

  });
}

module.exports = reddit;