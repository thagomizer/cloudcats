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

var addButton = document.getElementById('add');
var progress = document.getElementById('progress');
var main = document.querySelector('main');
var snackbar = document.getElementById('snackbar');
addButton.addEventListener('click', function() {
  main.classList.add('cover2');
  main.classList.remove('cover');
  progress.style.display = 'block';
  //fetch('http://localhost:8081/go', { mode: 'no-cors' });
  snackbar.MaterialSnackbar.showSnackbar({
    message: "Let's get started!"
  });
  setTimeout(showDialog, 2000);
});

var dialog = document.querySelector('dialog');
dialog.querySelector('.close').addEventListener('click', function() {
  dialog.close();
});  
function showDialog() {
  var dialogContent = document.getElementById('dialogContent');
  var dialogTitle = document.getElementById('dialogTitle');
  dialogContent.innerText = 'It looks like the Internet really likes cats. Who knew?';
  dialogTitle.innerText = 'CATS WIN!'
  progress.style.display = 'none';
  dialog.showModal();
}

