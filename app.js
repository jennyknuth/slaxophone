require('dotenv').load();


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/site');
var games = require('./routes/games');

// var Slack = require('slack-client');
// var token = 'process.env.SLAXOPHONE_BOT_TOKEN';
//
// var slackbot = new Slack(token, true, true);
//
// slackbot.on('open', function() {
//   var channel, channels, group, groups, id, messages, unreads;
//   channels = [];
//   groups = [];
//   unreads = slack.getUnreadCount();
//   channels = (function() {
//     var _ref, _results;
//     _ref = slack.channels;
//     _results = [];
//     for (id in _ref) {
//       channel = _ref[id];
//       if (channel.is_member) {
//         _results.push("#" + channel.name);
//       }
//     }
//     return _results;
//   })();
//   groups = (function() {
//     var _ref, _results;
//     _ref = slack.groups;
//     _results = [];
//     for (id in _ref) {
//       group = _ref[id];
//       if (group.is_open && !group.is_archived) {
//         _results.push(group.name);
//       }
//     }
//     return _results;
//   })();
//   console.log("Welcome to Slack. You are @" + slack.self.name + " of " + slack.team.name);
//   console.log('You are in: ' + channels.join(', '));
//   console.log('As well as: ' + groups.join(', '));
//   messages = unreads === 1 ? 'message' : 'messages';
//   return console.log("You have " + unreads + " unread " + messages);
// });
//
// slackbot.on('message', function(message) {
//   console.log("got a message");
//   console.log(message);
//   channel = slackbot.getDMByID(message.id)
//   user = slackbot.getDMByName(message.user)
//   response = ''
// });

// slackbot.login();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/games', games);
app.get('/styleguide', function (req, res, next) {
  res.render('styleguide')
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
