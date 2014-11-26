var redis = require('redis');
var db = redis.createClient();

var Keys = [];
var channel;
var KeysofEntries = [];
var ItemsArray = [];

module.exports = Entry;

function Entry(obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
}

Entry.prototype.save = function(fn) {
  var entryJSON = JSON.stringify(this);
  var entryParse = JSON.parse(entryJSON);
  var Id = 'entry:id:' + entryParse.username + ':' + entryParse.descriptionExp;
  
  db.hmset(Id, entryParse, function(err) {
    if (err) return fn(err);
    fn(null);
  });
};

Entry.delete = function(username, descriptionExp, fn) {
  var Id = 'entry:id:' + username + ':' + descriptionExp;
  db.del(Id, function(err) {
    if(err) fn(err);
    fn(null);
  });
};

Entry.getKeys = function(keyPattern, fn) {
  db.keys(keyPattern, fn);
};

Entry.getItemsforKey = function(id) {
  var items;
  db.hgetall(id, function(err, items) {
    if(err) return;
    if(items) {
      ItemsArray.push(items);
      Entry.getNext();
    }
  });
};

Entry.getNext = function(err, result) {
  var currentKey = KeysofEntries.shift();
  if(typeof(currentKey)=='undefined' || currentKey==null) {
    channel.emit('join', {Entries: ItemsArray});
  } else {
    Entry.getItemsforKey(currentKey);
  }
};

Entry.getAllItems = function(username, chan, fn) {
  var keyPattern = "entry:id:" + username + ":" + "*";
  var Keys = [];
  KeysofEntries.length = 0;
  KeysofEntries = [];
  ItemsArray.length = 0;
  ItemsArray = [];
  channel = chan;
  Entry.getKeys(keyPattern, function(err, Keys){
    if(err) fn(err);
    KeysofEntries = Keys.slice(0);
    Entry.getNext();
  });
};

var channelAPI;

Entry.getItemsforKeyAPI = function(id) {
  var items;
  db.hgetall(id, function(err, items) {
    if(err) return;
    if(items) {
      ItemsArray.push(items);
      Entry.getNextAPI();
    }
  });
};

Entry.getNextAPI = function() {
  var currentKey = KeysofEntries.shift();
  if(typeof(currentKey)=='undefined' || currentKey==null) {
    channelAPI.emit('JoinMe', {Entries: ItemsArray});
  } else {
    Entry.getItemsforKeyAPI(currentKey);
  }
};

Entry.getAllItemsAPI = function(username, chan, fn) {
  var keyPattern = "entry:id:" + username + ":"+ "*";
  var Keys = [];
  KeysofEntries.length = 0;
  KeysofEntries = [];
  ItemsArray.length = 0;
  ItemsArray = [];
  channelAPI = chan;
  Entry.getKeys(keyPattern, function(err, Keys){
    if(err) fn(err);
    KeysofEntries = Keys.slice(0);
    Entry.getNextAPI();
  });
};