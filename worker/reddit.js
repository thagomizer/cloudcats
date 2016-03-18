'use strict';

const request = require('request');
const util = require('util');
const async = require('async');

let reddit = {
  getImageUrls: (callback) => {
    console.log("Request data from reddit...");
    let allPosts = [];
    let pagesToFetch = 3;
    let fetchFns = Array(pagesToFetch);
    let fetchFn = (after, callback) => {
      console.log("Loading page: " + after);
      _populatePageUrls(after, allPosts, (err, after) => {
        if (err) { 
          console.error("Error getting page urls from reddit post: " + util.inspect(err));
          return callback(err);
        }
        callback(null, after);
      });
    };
    fetchFns.fill(fetchFn);
    fetchFns[0] = async.apply(fetchFn, null);

    async.waterfall(fetchFns, (err, result) => {
      if (err) {
        console.error("Error getting reddit posts: " + util.inspect(err));
        return callback(err)
      }
      console.log('Reddit data request complete: ' + allPosts.length);
      callback(err, allPosts);
    });
  }
}

function _populatePageUrls(after, allPosts, callback) {
  console.log('populating page urls...');
  _getPage(after, (err, page) => {
            
    if (err) { 
      console.error("Error getting page of reddit posts: " + util.inspect(err));
      return callback(err);
    }
    console.log("loaded page!");
    
    var posts = page.children.filter((post) => {
      return post.data &&
              post.data.preview &&
              post.data.preview.images &&
              post.data.preview.images.length > 0;
    }).map((post) => {
      return post.data.preview.images[0].source.url;
    });
    Array.prototype.push.apply(allPosts, posts);

    callback(null, page.after);
  });
}

function _getPage(after, callback) {
  
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
      callback(err);
    } else {
      callback(null, body.data);
    }
  });
}

module.exports = reddit;