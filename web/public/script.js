
var cnt = document.getElementById('cnt');
var btn = document.getElementById('btn');
var snackbar = document.getElementById('snackbar');

var nub = PUBNUB.init({
  subscribe_key: subscribeKey,
  ssl: true
});

nub.subscribe({
  channel: 'cloudcats',
  message: function(m) {
    console.log(m);
  }
});