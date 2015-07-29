var db = require('monk')(process.env.MONGOLAB_URI);
var games = db.get('games');
var players = db.get('players');
var express = require('express');
var router = express.Router();
var unirest = require('unirest');

var ROUNDS = 4;

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

var Game = function (body) {
  // var timestamp = Math.floor(new Date() / 1000).toString()
  this.text = [body.text]
  this.user_id = [body.user_id]
  this.counter = 1
}

// configuration for RTM API from slaxophone-bot: this works
var configPayload = function (obj) {
  // console.log('object coming in to config', obj);
  var payload = {}
  payload.id = 1 // hard coding for now, maybe make it equal to game _id later?
  payload.type = "message"
  payload.user_id = obj.user_id.pop()
  // // obj.channel = '@knuth'//'@' + obj.user_name
  // obj.channel = 'U083ARY6L' // hardcoding my channel for now
  if (obj.counter % 2 === 0) {
    // console.log('making payload, counter = ', obj.counter);
    payload.text = 'Write a caption for this picture <' + obj.text.pop() + '> ' + '\n(Follow your message with another message containing simply /reply)'
  } else {
    payload.text = 'Please illustrate this sentence ' + obj.text.pop() + '\n(Follow your upload with another message containing simply /reply)'
  }
  payload.username='slaxophone-bot'
  payload.as_user='true'
  // payload = JSON.stringify(payload)
  // console.log('stringified JSON?: ', payload);
  return payload
}

// send via RTM API for chat.postMessage slaxophone-bot: this works
var sendPayload = function (JSONobj) {
  players.findOne({id: JSONobj.user_id}, function (err, doc) { // ultimately: find a user who has not played yet
    // console.log('player doc:', doc);
    unirest.post('https://slack.com/api/chat.postMessage?token=' + process.env.SLAXOPHONE_BOT_TOKEN + '&channel=' + doc.channel) //
    .header('Accept', 'application/json')
      .send(JSONobj)
      .end(function (response) {
        // console.log('response body from unirest', response.body);
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
  payload.as_user='true'
  // payload = JSON.stringify(payload)
  // console.log('stringified JSON?: ', payload);
  return payload
}

var putNewMessageInDatabase = function (channel) {
  unirest.get('https://slack.com/api/im.history?token=' + process.env.SLAXOPHONE_BOT_TOKEN + '&channel=' + channel + '&count=1')
        .end(function (response) {
          var messages = response.body.messages // an array of one
          // console.log("API text: ", messages[0].text)
          // console.log("API picture url: ", messages[0].file.url)
          games.findOne({}, function (err, doc) { // eventually find THE game, ahem
            // console.log('doc: ', doc);
            // console.log('counter before: ', doc.counter);
            doc.counter += 1
            // console.log('counter after: ', doc.counter);
            // console.log('doc.text before: ', doc.text);
            if (messages[0].text[0] === '<') {
              doc.text.push(messages[0].file.url)
            } else {
              doc.text.push(messages[0].text)
            }
            // console.log('doc.text after: ', doc.text);
            var person = messages[0].user
            // console.log('person: ', person);
            // console.log('doc.user_id before: ', doc.user_id);
            doc.user_id.push(person)
            // console.log('doc.user_id after: ', doc.user_id);
            // console.log('doc to go into update', doc);
            games.update({_id: doc._id}, doc, function () {
              games.findOne({}, function (err, item) { //eventually find THE game
                console.log("next doc going in to payload:", item);
                if (item.counter < ROUNDS) {
                  var payload = configPayload(item)
                  console.log('next round payload object, check for image if counter even', payload)
                  sendPayload(payload)
                  console.log('next payload sent with unirest')
                  // response.redirect('/games')
                } else {
                  formatAndSend(item)
                }
              })
            })
          })
        })
}


router.get('/', function(req, res, next) {
  games.find({}, function(err, docs) {
    if (err) throw err
    // console.log('docs', docs);
    res.render('games/index', {docs: docs})
  })
});

// route for new games coming in from Slack with /slaxophone command
router.post('/', function(req, res, next) {
  // removePlayers()
  getPlayers()
  games.remove({}) // this ensures one game at a time, take out when games can be tracked with cookies
  // console.log('starting new game', req.body);
  var game = new Game(req.body)
  // console.log("new game object: ", game);

  games.insert(game, function (err, doc) {
    var payload = configPayload(doc)
    // console.log('payload new: ', payload)
    sendPayload(payload)
    // console.log('payload sent with unirest')
    res.redirect('/games')
  })
})

router.get('/new', function (req, res, next) {
  res.render('games/new')
})

// this will be the route for all rounds after game is established, triggered with /reply
router.post('/update', function(req, res, next) {
  // console.log("req.body.channel_id ", req.body.channel_id);
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
