var Entry = require('../lib/entry');

var userId = '';
var userName = '';
var firstTime = 0;

exports.SetUserId = function(Id, Name) {
	userId = Id;
	userName = Name;
};

exports.ClearUserId = function(Id, Name) {
	userId = '';
	userName = '';
};

/* No need for this since it already has the information of logged-in user
exports.GetUserName = function() {
	return userName;	
}
*/

exports.list = function(req, res, next) { 
  	res.render('main', { title: 'Expense Manager App'}); 
};

exports.deleteentry = function(req, res, next) {
  var data = req.body.entry;
  var username = res.locals.user.name;
  var description = data.descriptionExp;
 
  Entry.delete(username, description, function(err) {
     if (err) return next(err);
     if(req.remoteUser) {
        res.json({message: 'Entry deleted successfully.'});
      }
  });
};

exports.submit = function(req, res, next) {
  var data = req.body.entry;

  var entry = new Entry({
    "username": res.locals.user.name,
    "descriptionExp": data.descriptionExp,
    "dateExp": data.dateExp,
    "timeExp": data.timeExp,
    "amountExp": data.amountExp,
    "commentsExp": data.commentsExp
  });

  entry.save(function(err) {
    if (err) return next(err);
    if (req.remoteUser) {
      res.json({message: 'Entry added.'});
    }
  }); 
};

var EventEmitter = require('events').EventEmitter;
var channel = new EventEmitter();

exports.Allentries = function(req, res, next) {
  var channel = new EventEmitter();
  var username = res.locals.user.name;
  Entry.getAllItemsAPI(username, channel, function(){});
  channel.on('JoinMe', function(ItemEntries) {
    var entries = ItemEntries.Entries;
    res.format({
      json: function(){
        res.send(entries);
      },

      xml: function(){
        res.render('entries/xml', { entries: entries });
      }
    });
  });
};

// the current implementation sucks. Since for multiple logins from different machines, the setusername will mes things badly
//since UserName sent through template can't be resetted while logging and logout, can only happen on server side. The idea of sending Username thru template won't work
// the current implementation will work for remember password, actually across all browsers. shitty!

/*todo send the username and entries from here itself */