var db = require('monk')(process.env.MONGOLAB_URI);
var games = db.get('games');
var express = require('express');
var router = express.Router();
var unirest = require('unirest');

/* GET users listing. */
router.get('/', function(req, res, next) {
  games.find({}, function(err, docs) {
    if (err) throw err
    // console.log('docs', docs);
    res.render('games/index', {docs: docs})
  })
});

router.get('/new', function (req, res, next) {
  res.render('games/new')
})

// router.get('/update', function (req, res, next) {
//   res.render('games/test')
// })

//configuration for slaxophone-bot
var configPayload = function (obj) {
  obj.id = obj.timestamp
  obj.type = "message"
  obj.user_name = obj.user_name.pop()
  obj.channel = 'U0861KFLJ'//hardcoded jenny '@' + obj.user_name
  if (obj.counter % 2 === 0) {
    obj.text = obj.write + obj.text.pop()
  } else {
    obj.text = obj.draw + obj.text.pop()
  }
  obj.username='U085WTG3A' //slaxophone-bot
  obj = JSON.stringify(obj)
  console.log('stringified JSON?: ', obj);
  return obj
}

// configuration for incoming webhook
// var configPayload = function (obj) {
//   obj.user_name = obj.user_name.pop()
//   obj.channel = '@knuth'//'@' + obj.user_name
//   if (obj.counter % 2 === 0) {
//     obj.text = obj.write + obj.text.pop()
//   } else {
//     obj.text = obj.draw + obj.text.pop()
//   }
//   obj.username='slaxophone-bot'
//   obj = JSON.stringify(obj)
//   console.log('stringified JSON?: ', obj);
//   return obj
// }

// configuration for RTM API
// var configPayload = function (obj) {
//   obj = {
//     "id": 1,
//     "type": "message",
//     "channel": "#general",
//     "text": "Hello world"
//   }
  // obj.id = obj.timestamp
  // obj.type = "message"
  // // obj.user_name = obj.user_name.pop()
  // // obj.channel = '@knuth'//'@' + obj.user_name
  // obj.channel = 'U083ARY6L' // hardcoding my channel for now
  // if (obj.counter % 2 === 0) {
  //   obj.text = obj.write + obj.text.pop()
  // } else {
  //   obj.text = obj.draw + obj.text.pop()
  // }
  // // obj.username='slaxophone-bot'
  // obj = JSON.stringify(obj)
//   console.log('stringified JSON?: ', obj);
//   return obj
// }

// 'https://slack.com/api/im.open?token=process.env.SLACK_TOKEN&user=U083ARY6L'
// var getNewMessage = function () {
//   unirest.get('https://slack.com/api/rtm.start?token=' + process.env.SLACK_TOKEN + '&pretty=1')
//         .end(function (response) {
//           console.log(response.ims[0]);
//           var slackIms = response.body.ims; // an array
//           res.render('index', {docs: slackIms});
//         })
// }

//send via webhook
// var sendPayload = function (JSONstring) {
//   unirest.post('https://hooks.slack.com/services/' + process.env.SLACK_KEYS)
//   // unirest.post('https://slack.com/api/im.open?token=' + process.env.SLACK_TOKEN + '&user=U083ARY6L')
//   .header('Accept', 'application/json')
//   .send(JSONstring)
//   .end(function (response) {
//     console.log('response body from unirest', response.body);
//   });
// }

//send via slaxophone-bot
var sendPayload = function (JSONstring) {
  unirest.post('https://hooks.slack.com/services/' + process.env.SLACK_KEYS)
  // unirest.post('https://slack.com/api/im.open?token=' + process.env.SLACK_TOKEN + '&user=U083ARY6L')
  .header('Accept', 'application/json')
  .send(JSONstring)
  .end(function (response) {
    console.log('response body from unirest', response.body);
  });
}

// this will be the route for slash command coming in from Slack, whether new or an update
router.post('/update', function(req, res, next) {
  console.log('is timestamp in req.body? ', req.body);// timestamp, text, username, but no counter, etc.
  console.log('counter ', req.body.counter);
  if (req.body.timestamp) { // if established game
    games.findOne({timestamp: req.body.timestamp}, function (err, doc) { // heroku version
      if (err) throw err
      doc.text.push(req.body.text) // push message on to games.text
      doc.user_name.push(req.body.user_name)
      doc.counter += 1
      games.update({_id: doc._id}, doc, function (err, entry) {
        if (err) throw err
        var payload = configPayload(doc)
        console.log('payload', payload)
        sendPayload(payload)
        console.log('payload sent with unirest')
        res.redirect('/games')
      })
    })
  } else { // if new game
    console.log('game not found, starting new game', req.body);
    // req.body.timestamp = new Date() // take this out for slack version
    var timestamp = Math.floor(new Date() / 1000).toString()
    console.log('timestamp', timestamp);
    req.body.timestamp = timestamp
    req.body.text = [req.body.text]
    req.body.user_name = [req.body.user_name]
    req.body.counter = 1
    req.body.draw = 'Please illustrate this sentence: '
    req.body.write = 'Write a caption for this picture: '

    games.insert(req.body, function (err, doc) {
      var payload = configPayload(doc)
      console.log('payload new: ', payload)
      sendPayload(payload)
      console.log('payload sent with unirest')
      res.redirect('/games')
    })
  }
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

// router.post('/update', function (req, res, next) {
//   // incoming from Slack
// })
module.exports = router;
