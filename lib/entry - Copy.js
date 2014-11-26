var redis = require('redis');
var db = redis.createClient();

var Keys = [];
module.exports = Entry;

function Entry(obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
}

Entry.prototype.save = function(fn) {
  var entryJSON = JSON.stringify(this);
  console.log('Username is: ' + this["username"]);
  var entryParse = JSON.parse(entryJSON);
  console.log('Entries: ' + entryParse.username + entryParse.descriptionExp);
  db.incr('entry:ids', function(err, id) {
      if (err) return fn(err);
      entryJSON.id = id;
      console.log('The id given is: ' + id);
      console.log('Setting this for ' + 'entry:id:' + entryParse.username + ':' + entryParse.descriptionExp);
      db.set('entry:id:' + entryParse.username + ':' + entryParse.descriptionExp, id, function(err) {
        if (err) return fn(err);
        console.log('The entry json placed at:' + id + ' is ' + entryJSON);
        db.hmset('entries:' + id, entryParse, function(err) {
          fn(err);
        });
      });
  });
  //db.hmset('entry:id'entryJSON.username, )
  /*db.lpush(
    'entries',
    entryJSON,
    function(err) {
      if (err) return fn(err);
      fn();
    }
  );*/
};

Entry.getId = function(username, descriptionExp, fn) {
  //console.log(' For id ' + descriptionExp);
  //console.log('Calling ' + 'entry:id:' + username + ':' + descriptionExp);
  db.get('entry:id:' + username + ':' + descriptionExp, fn);
  //console.log('the id is:' + id);
};

Entry.getKeys = function(id, fn) {
  db.keys(id, fn);
};

Entry.getKeyId = function(key, fn) {
  db.get(key, fn);
};

Entry.getItemsForKeyId = function(id) {
    var items;
    db.hgetall('entries:' + id, function(err, items) {
        if(err) return;
        if(items) {
          //console.log('Items are: ' + items);
          var newItem = { username: items.username, descriptionExp: items.descriptionExp, timeExp: items.timeExp, amountExp: items.amountExp, commentsExp: items.commentsExp};
         // console.log(newItem);
          var newItemJSON = JSON.stringify(newItem);
          //console.log(newItemJSON);
        }
    console.log('The tiesm ares: ' + items);
    return items;
    });
};

Entry.getItemsForKey = function(key, fn) {
  Entry.getKeyId(key, function(err, id) {
    if(err) return fn(err);
    //console.log('Id is: ' + id);
    items = Entry.getItemsForKeyId(id);
    console.log(items);
    //fn(null,items);
    /*db.hgetall('entries:' + id, function(err, items) {
      if(err) return;
      if(items) {
        //console.log('Items are: ' + items);
        var newItem = { username: items.username, descriptionExp: items.descriptionExp, timeExp: items.timeExp, amountExp: items.amountExp, commentsExp: items.commentsExp};
       // console.log(newItem);
        var newItemJSON = JSON.stringify(newItem);
        //console.log(newItemJSON);
      }
      fn(null, items);
    });*/
  });
};

var KeysOfEntries = [];
var ItemsArray = [];
var BadKey = 0;

Entry.getItemsOfKey = function(key, channel) {
  db.get(key, function(err, id) {
    if(key=='badkey'){
      BadKey = 1;
    }
    else if(err) return fn(err);
        //console.log('Id is: ' + id);
      //items = Entry.getItemsForKeyId(id);
      //console.log(items);
        //fn(null,items);
    db.hgetall('entries:' + id, function(err, items) {
      if(BadKey == 1) {
        BadKey = 0;
        console.log('Bad Key');
        if(ItemsArray && ItemsArray.length>0){
          console.log('Items are: ' + ItemsArray[ItemsArray.length - 1].username);
        }
        channel.emit('join',{Entries: ItemsArray});
        //ItemsArray.length=0;
        //ItemsArray = [];
      }
      else if(err) return;
      if(items) {
            //console.log('Items are: ' + items);
        var newItem = { username: items.username, descriptionExp: items.descriptionExp, timeExp: items.timeExp, amountExp: items.amountExp, commentsExp: items.commentsExp};
        //console.log(newItem);
        var newItemJSON = JSON.stringify(newItem);
        ItemsArray.push(newItem);
        //console.log('ItemsArray is: ' + ItemsArray[ItemsArray.length - 1].username);
            //console.log(newItemJSON);
        //Entry.getNext(null, items);
      }
    });
  });
};

Entry.getNext = function(err, result) {
  var currentKey = KeysOfEntries.shift();
  //console.log('currentkey is: '+ currentKey);
  if(result != '') {
      ItemsArray.push(result);
 //     console.log('One items is: ' + result);
  }
  //console.log('Current Key exists: ' + currentKey);
  if(!currentKey){
    console.log('Baba jee ka thullu');
  }
  if(currentKey) {
    //console.log('A');
    Entry.getItemsOfKey(currentKey);
  } else {
    console.log('Current key is finally null');
    //Entry.getNextTask();
  }
 // console.log('Final Exit');
};

Entry.getAllKeys = function(keyPattern, fn) {
  db.keys(keyPattern, fn);
};

Entry.getAllEntries = function(username, channel, fn) {
  //console.log('In getall');
  var Items = [];
  var keyPattern = "entry:id:" + username + "*";
  var Keys;

  Entry.getAllKeys(keyPattern, function(err, Keys){
    if(err) return;
    /*KeysOfEntries = Keys.splice(0);
    //console.log('Keys are: ' + KeysOfEntries);
    Entry.getNext(null, '');
    console.log('Have read all the entries');
    console.log('Entries are: ' + ItemsArray);
    fn(null, ItemsArray);*/
    Keys.push('badkey');
    Keys.forEach(function(key){
      Entry.getItemsOfKey(key, channel);
    });
  });
};

/*
Entry.getAllEntries = function(username, fn) {
  //console.log('In getall');
  var Items = [];
  var keyPattern = "entry:id:" + username + "*";
  var Keys;

  Entry.getAllKeys(keyPattern, function(err, Keys) {
    if(err) return;
    KeysOfEntries = Keys.splice(0);
    console.log('KeysofEntries are: ' + KeysOfEntries);
    Entry.getNextTask();
  });
};


Entry.getAllEntriesItems = function() {
  Entry.getNext(null, '');
  console.log('Have read all the entries');
  //console.log('Entries are: ' + ItemsArray);
    //fn(null, ItemsArray);
};

var tasks = [Entry.getAllEntries, Entry.getAllEntriesItems];

Entry.getNextTask = function(username, fn) {
  var currentTask = tasks.shift();
  if(currentTask) {
    currentTask(username);
  }  else {
    console.log('Finish with NextTask');
    fn(null, ItemsArray);
  }
};
*/

    /*
    Keys.forEach(function(key){
      console.log('Parsing kes');
      Entry.getItemsForKey(key);
    });
    console.log('non Returning items');
    
    Items.forEach(function(ENTRY){
          console.log('Entry 123 are: ' + ENTRY);
    });
    fn(null, Items);
    console.log('Returning items');
  });
}; */
/*
Entry.getAll = function(username, fn) {
  var Items = ['asdfs', 'affdfd'];
  Entry.getKeys("entry:id:" + username + "*", function(err, Keys) {
    if(err) return;
    console.log('Matchin keys');
            //console.log('All Keys are: ' + Keys);
    Keys.forEach(function(key) {
      db.get(key, function(err, id) {
                    //console.log('Id for key is: ' + id);
        db.hgetall('entries:' + id, function(err, items) {
            if(items) {
                var newItem = new Entry(items);
                            //var newItem = { username: items.username, descriptionExp: items.descriptionExp, timeExp: items.timeExp, amountExp: items.amountExp, commentsExp: items.commentsExp};
                //console.log(newItem);
                var newItemJSON=JSON.stringify(items);
                //console.log(newItemJSON);
                Items.push(newItemJSON);
            }
        });
      });
      console.log('Looping keys');
    });
    console.log('Returning itmes');
    Items.forEach(function(itttt){
       console.log('asdfklj' + itttt) ;
    });
    console.log('The items are: ' + Items);
    fn(null, Items);
  });
  console.log('super rtun');
  Items.forEach(function(itttt){
       console.log('asdfklj') ;
    });
};*/

Entry.delete = function(username, descriptionExp, fn) {
    Entry.getId(username, descriptionExp, function(err, id) {
      if (err) return fn(err);
      console.log('Callig entries:del for id: ' + id);
      db.del('entries:' + id, function(err) {
        fn(err);
        console.log('Deleting entries del');
      });
    });
};

Entry.getRange = function(from, to, username, fn) {
  db.lrange('entries', from, to, function(err, items) {
    if (err) return fn(err);
    var entries = [];

    items.forEach(function(item) {
      var itemParse=JSON.parse(item);
      if (itemParse.username == username) {
          entries.push(JSON.parse(item));
      }
    });

    fn(null, entries);
  });
};

Entry.count = function(fn) {
  db.llen('entries', fn);
};




  /* 
      db.keys("entry:id:"+username+"*", function(err, Keys) { 
       // console.log('All Keys are: ' + Keys);
        Keys.forEach(function(key) {
         //   console.log('Individual key is: ' + key);
            db.get(key, function(err, id) {
           //     console.log('Id for key is: ' + id);
                db.hgetall('entries:'+id, function(err, items) {
                    if(items) {
                        //console.log('for entries: id ' + items);
                        var itemsJSON = JSON.stringify(items);
                        //console.log('THe JSON is: ' + itemsJSON);
                        var newItem = { username: items.username, descriptionExp: items.descriptionExp, timeExp: items.timeExp, amountExp: items.amountExp, commentsExp: items.commentsExp};
                       
                        //console.log(newItem);
                        Items.push(newItem);
                    }
                });
            });
        });
        console.log('Items are: ' + Items);
    });
    //console.log('Keys are: ' + Keys);
    fn(null, Items); 
  */