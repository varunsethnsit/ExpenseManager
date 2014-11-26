var socketio = require('socket.io');

var entries = require('../routes/entries');
var Entry = require('./entry');
var User = require('./user');
var UserName = '';

var EventEmitter = require('events').EventEmitter;
var channel = new EventEmitter();

exports.listen = function(server) {
  
  io = socketio.listen(server);
  
  io.sockets.on('connection', function(socket) {
      
      socket.on('GetUserName', function() {
         // No need for this since it already has the information about logged-in user UserName = entries.GetUserName();
          socket.emit('AcceptUserName', {username: UserName});
      });
      
      var KeysOfEntries = [];

      socket.on('GetAllPosts', function() {
          Entry.getAllItems(UserName, channel, function(err, KeysOfEntries) {
          });
      });
      
      channel.on('join', function(ItemEntries) {
          var Items = ItemEntries.Entries;
          socket.emit('AcceptAllPosts', {Entries: Items});
      });

      socket.on('RegisterUser', function(Post) {
         User.getByName(Post.username, function(err, user) {
          if(err) {
            socket.emit("RegisterResult", {success: false, message: "Database error: Try again!"});
          } 

          if (user.id) {
            socket.emit("RegisterResult", {success: false, message: "Username already taken!" });
          }
          else {
              user = new User({
                  name: Post.username,
                  pass: Post.password
                  });
            
              user.save(function(err) {
                if (err) {
                  //return next(err);
                  socket.emit("RegisterResult", {success: false, message: "Database error: Try again!"});
                }
                socket.emit("RegisterResult", {success: true, message: "Account Created", username: user.name});
                  //ToDo Create the session object here. 
                entries.SetUserId(user.id, user.name); 
                UserName = user.name; 
              });
          }
        });
      });
      
      socket.on('LoginUser', function(Post) {
         User.authenticate(Post.username, Post.password, function(err, user) {
            if (err) {
              socket.emit('LoginResult', {success: false, message: "Database error: Try again!"});
            } 
            if (user) {
              socket.emit('LoginResult', {success: true, message: "Logged In!", username: user.name});
              entries.SetUserId(user.id, user.name);
              UserName = user.name;  
            } else {
              socket.emit('LoginResult', {success: false, message: "Invalid Credentials!"});
            }
          });
      });
      
      socket.on('Logout', function() {
          UserName = '';
          socket.emit('Loggedout', {success: true});
          entries.ClearUserId();
      });
      
       socket.on('DeletePost', function(Post) {
          var descriptionExp = Post.descriptionExp;
          Entry.delete(UserName, descriptionExp, function(err) {
            if (err) return next(err);
            socket.emit('PostDeleted', {success:true});
          });
       });
       
       socket.on('SavePost', function(Post) {
          var descriptionExp = Post.descriptionExp;
          var dateExp = Post.dateExp;
          var timeExp = Post.timeExp;
          var amountExp = Post.amountExp;
          var commentsExp = Post.commentsExp;
          var rowdescription = Post.rowdescription;
          var rowdate = Post.rowdate;
          var rowtime = Post.rowtime;
          var rowamount = Post.rowamount;
          var rowcomments = Post.rowcomments;

          Entry.delete(UserName, rowdescription, function(err) {
            if (err) return next(err);
            //socket.emit('PostDeleted', {success:true});
          });
          
          var entry = new Entry({
                    "username": UserName,
                    "descriptionExp": descriptionExp,
                    "dateExp": dateExp,
                    "timeExp": timeExp,
                    "amountExp": amountExp,
                    "commentsExp": commentsExp
                  });

          entry.save(function(err) {
            if(err){
       //       socket.emit('PostAdded', {success: false, message: "Database error: Try again!"});
            } else {
              socket.emit('PostSaved',{success:true});
            }
          });
      });

      socket.on('AddPost', function(Post) {
          var descriptionExp = Post.descriptionExp;
          var dateExp = Post.dateExp;
          var timeExp = Post.timeExp;
          var amountExp = Post.amountExp;
          var commentsExp = Post.commentsExp;
          var entry = new Entry({
                    "username": UserName,
                    "descriptionExp": descriptionExp,
                    "dateExp": dateExp,
                    "timeExp": timeExp,
                    "amountExp": amountExp,
                    "commentsExp": commentsExp
                  });
          entry.save(function(err) {
            if(err) {
              socket.emit('PostAdded', {success: false, message: "Database error: Try again!"});
              return;
            }
              // for REST API use req.remoteuser line
            socket.emit('PostAdded', {success: true, message: "Post Added Successfully !", entry: entry});
          });
      });  
        
   });
};