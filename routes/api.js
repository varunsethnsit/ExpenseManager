var express = require('express');
var User = require('../lib/user');
var Entry = require('../lib/entry');
var username = '';

exports.auth = express.basicAuth(User.authenticate);

exports.user = function(req, res, next){
  User.get(req.params.id, function(err, user){
    console.log('My Name is: ' + user.name);
    console.log('User id is: ' + user.id);
    if (err) return next(err);
    if (!user.id) return res.send(404);
    username=user.name;
    res.json(user);
  });
};
