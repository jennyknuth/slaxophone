var db = require('monk')(process.env.MONGOLAB_URI);
var games = db.get('games');
var players = db.get('players');
var archives = db.get('archives')
var express = require('express');
var router = express.Router();
var unirest = require('unirest');

var ROUNDS = 5;

// use to add current players to the players collection
var getPlayers = function () { // fix this so it includes all players, akyuna and john not in list
  players.remove({})
  unirest.get('https://slack.com/api/rtm.start?token=' + process.env.SLAXOPHONE_BOT_TOKEN + '&pretty=1Y')
  // unirest.get('https://slack.com/api/rtm.start?token=' + process.env.SLACK_TOKEN + '&pretty=1Y')
  .end(function (response) {
    var ims = response.body.ims; // an array
    ims.forEach( function (player) {
      players.find({id: player.user}, function (err, docs) {
        if (docs.length === 0) {
          players.insert({id: player.user, channel: player.id, deleted: player.is_user_deleted})
          players.remove({id: "USLACKBOT"}) // bot's not playing!
          players.remove({deleted: true})
        }
      })
    })
  })
}

getPlayers()

var Game = function (body) {
  // var timestamp = Math.floor(new Date() / 1000).toString()
  this.round1 = body.text
  this.user_id = [body.user_id]
  this.counter = 1
}

// configuration for RTM API from slaxophone-bot: this works
var configPayload = function (obj) {
  var payload = {}
  payload.id = 1 // hard coding for now, maybe make it equal to game_id later?
  payload.type = "message"
  payload.user_id = obj.user_id.pop() // fix this: change to a user who has yet to go!
  var round = 'round' + obj.counter
  console.log('round in configPayload', round);
  if (obj.counter % 2 === 0) {
    payload.text = 'Write a caption for this picture <' + obj.round + '> ' + '\n(Follow your message with another message containing simply /reply)'
  } else {
    payload.text = 'Please illustrate this sentence ' + obj.round + '\n(Follow your upload with another message containing simply /reply)'
  }
  payload.username='slaxophone-bot'
  payload.as_user='true'
  return payload
}

// send via RTM API for chat.postMessage slaxophone-bot: this works
var sendPayload = function (JSONobj) {
  console.log('sending payload', JSONobj)
  players.findOne({id: JSONobj.user_id}, function (err, doc) { // ultimately: find a user who has not played yet
    unirest.post('https://slack.com/api/chat.postMessage?token=' + process.env.SLAXOPHONE_BOT_TOKEN + '&channel=' + doc.channel) //
    .header('Accept', 'application/json')
      .send(JSONobj)
      .end(function (response) {
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
//   return obj

// send via incoming webhook: this works
// var sendPayload = function (JSONstring) {
//   unirest.post('https://hooks.slack.com/services/' + process.env.SLACK_KEYS)
//   .header('Accept', 'application/json')
//   .send(JSONstring)
//   .end(function (response) {
//     console.log('response body from unirest', response.body);
//   });
// }

var formatAndSend = function (obj) {
  var payload = {}
  payload.id = 1 // hard coding for now, maybe make it equal to game _id later?
  payload.type = "message"
  payload.user_id = obj.user_id.pop()
  payload.username='slaxophone-bot'
  payload.as_user= true
  return payload
}

var putNewMessageInDatabase = function (channel) {
  unirest.get('https://slack.com/api/im.history?token=' + process.env.SLAXOPHONE_BOT_TOKEN + '&channel=' + channel + '&count=1')
        .end(function (response) {
          var messages = response.body.messages // an array of one
          games.findOne({}, function (err, doc) { // eventually find THE game, ahem
            doc.counter += 1
            var round = 'round' + counter
            console.log('round;', round)
            if (messages[0].text[0] === '<') {
              doc.round = messages[0].file.url
            } else {
              doc.round = messages[0].text
            }
            var person = messages[0].user
            doc.user_id.push(person)
            games.update({_id: doc._id}, doc, function () {
              games.findOne({}, function (err, item) { //eventually find THE game
                if (item.counter < ROUNDS) {
                  var payload = configPayload(item)
                  sendPayload(payload)
                } else {
                  formatAndSend(item) // need to do this!
                }
              })
            })
          })
        })
}

router.get('/', function(req, res, next) {
  games.find({}, function(err, docs) {
    if (err) throw err
    res.render('games/index', {docs: docs})
  })
});

// route for new games coming in from Slack with /slaxophone command
router.post('/', function(req, res, next) {
  games.remove({}) // this ensures one game at a time, take out when games can be tracked with cookies
  var game = new Game(req.body)
  games.insert(game, function (err, doc) {
    var payload = configPayload(doc)
    sendPayload(payload)
    res.redirect('/games')
  })
})

router.get('/new', function (req, res, next) {
  res.render('games/new')
})

// this will be the route for all rounds after game is established, triggered with /reply
router.post('/update', function(req, res, next) {
  putNewMessageInDatabase(req.body.channel_id)
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
