var api = require('./routes/api');
var entries = require('./routes/entries');
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var messages = require('./lib/messages');
var user = require('./lib/middleware/user');
var validate = require('./lib/middleware/validate');
var Entry = require('./lib/entry');

var app = express();

// all environments
app.set('port', process.env.PORT || 9000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api.auth);
app.use(user);
app.use(messages);
app.use(app.router);
app.use(routes.notfound);
app.use(routes.error);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', entries.list);

app.get('/api/user/:id', api.user);
app.post('/api/entry', entries.submit);
app.post('/api/delentry', entries.deleteentry);
app.get('/api/entries', entries.Allentries);

if (process.env.ERROR_ROUTE) {
  app.get('/dev/error', function(req, res, next){
    var err = new Error('database connection failed');
    err.type = 'database';
    next(err);
  });
}

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Expense manager server initiated and listening on port ' + app.get('port'));
});

var expensemanagerserver = require('./lib/expensemanagerserver');
expensemanagerserver.listen(server);
