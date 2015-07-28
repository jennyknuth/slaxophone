var db = require('monk')(process.env.MONGOLAB_URI);
var games = db.get('games');
var players = db.get('players');
var express = require('express');
var router = express.Router();
var unirest = require('unirest');

var ROUNDS = 9;

// use for a clean slate in the database at any given time
var removePlayers = function () {
  players.remove({})
}

// use to add current players to the players collection
var getPlayers = function () {
  unirest.get('https://slack.com/api/rtm.start?token=' + process.env.SLAXOPHONE_BOT_TOKEN + '&pretty=1Y')
  .end(function (response) {
    var ims = response.body.ims; // an array
    ims.forEach( function (player) {
      players.find({id: player.user}, function (err, docs) {
        if (docs.length === 0) {
          players.insert({id: player.user, channel: player.id})
          players.remove({id: "USLACKBOT"}) // bot's not playing!
        }
      })
    })
  })
}

// removePlayers()
// console.log("players removed");
// getPlayers()
// console.log("players added");

var Game = function (body) {
  // var timestamp = Math.floor(new Date() / 1000).toString()
  this.text = [body.text]
  this.user_id = [body.user_id]
  this.counter = 1
  this.draw = 'Please illustrate this sentence: '
  this.write = 'Start your reply with "/reply." Write a caption for this picture: '
}

var getNewMessage = function (channel) {
  console.log("inside getNewMessage");
  unirest.get('https://slack.com/api/im.history?token=' + process.env.SLAXOPHONE_BOT_TOKEN + '&channel=' + channel + '&count=1')
        .end(function (response) {
          console.log("new messages from API: ", response.body);
        })
}

// configuration for RTM API from slaxophone-bot: this works
var configPayload = function (obj) {
  console.log('object coming in to config', obj);
  var pObj = {}
  pObj.id = 1 // hard coding for now, maybe make it equal to game _id later?
  pObj.type = "message"
  pObj.user_id = obj.user_id.pop()
  // // obj.channel = '@knuth'//'@' + obj.user_name
  // obj.channel = 'U083ARY6L' // hardcoding my channel for now
  if (obj.counter % 2 === 0) {
    pObj.text = obj.write + obj.text.pop() + ' Follow your message with another message containing the command /reply'
  } else {
    pObj.text = obj.draw + obj.text.pop() + ' Follow your upload with another message containing the command /reply'
  }
  pObj.username='slaxophone-bot'
  pObj.as_user='true'
  // pObj = JSON.stringify(pObj)
  // console.log('stringified JSON?: ', pObj);
  return pObj
}

// send via RTM API for chat.postMessage slaxophone-bot: this works
var sendPayload = function (JSONobj) {
  players.findOne({id: JSONobj.user_id}, function (err, doc) { // ultimately: find a user who has not played yet
    console.log('player doc:', doc);
    unirest.post('https://slack.com/api/chat.postMessage?token=' + process.env.SLAXOPHONE_BOT_TOKEN + '&channel=' + doc.channel) //
    .header('Accept', 'application/json')
      .send(JSONobj)
      .end(function (response) {
        console.log('response body from unirest', response.body);
      });
  })
}

//make payload for incoming webhook: this works
// var configPayload = function (obj) {
//   obj.user_name = obj.user_name.pop()
//   obj.channel = '@' + obj.user_name
//   if (obj.counter % 2 === 0) {
//     obj.text = obj.write + obj.text.pop()
//   } else {
//     obj.text = obj.draw + obj.text.pop()
//   }
//   obj.username='slaxophonebot'
//   obj = JSON.stringify(obj)
//   console.log('stringified JSON?: ', obj);
//   return obj

// send via webhook: this works
// var sendPayload = function (JSONstring) {
//   unirest.post('https://hooks.slack.com/services/' + process.env.SLACK_KEYS)
//   .header('Accept', 'application/json')
//   .send(JSONstring)
//   .end(function (response) {
//     console.log('response body from unirest', response.body);
//   });
// }

router.get('/', function(req, res, next) {
  games.find({}, function(err, docs) {
    if (err) throw err
    // console.log('docs', docs);
    res.render('games/index', {docs: docs})
  })
});

// route for new games coming in from Slack with slash command
router.post('/', function(req, res, next) {
  console.log('starting new game', req.body);
  var game = new Game(req.body)
  console.log("new game object: ", game);

  games.insert(game, function (err, doc) {
    var payload = configPayload(doc)
    console.log('payload new: ', payload)
    sendPayload(payload)
    console.log('payload sent with unirest')
    res.redirect('/games')
  })
})

router.get('/new', function (req, res, next) {
  res.render('games/new')
})

// this will be the route for all new rounds
router.post('/update', function(req, res, next) {
  console.log("req.body.channel_id ", req.body.channel_id);
  getNewMessage(req.body.channel_id)
})

router.get('/:id', function (req, res, next) {
  games.findOne({_id: req.params.id}, function (err, doc) {
    res.render('games/show', doc)
  })
})

router.get('/:id/edit', function(req, res, next) {
  games.findOne({_id: req.params.id}, function (err, doc) {

    res.render('games/edit', doc)
  })
})

module.exports = router;
