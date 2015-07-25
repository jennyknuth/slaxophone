var db = require('monk')(process.env.MONGOLAB_URI);
var games = db.get('games');
var express = require('express');
var router = express.Router();

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

// var configPayload = function (obj) {
//   var payload = obj
//   payload.user_name = doc.user_name.pop()
//   payload.channel_name = '@' + payload.user_name
//   payload.text = doc.text.pop()
//   console.log('payload', payload)
//   return payload
// }

// this will be the route for slash command coming in from Slack, whether new or an update
router.post('/update', function(req, res, next) {
  console.log('is timestamp in req.body? ', req.body);// timestamp, text, username, but no counter, etc.
  console.log('counter ', req.body.counter);
  if (req.body.timestamp) { // if established game
    games.findOne({timestamp: req.body.timestamp}, function (err, doc) { // heroku version
      if (err) throw err
      console.log('game found', doc);
      doc.text.push(req.body.text) // push message on to games.text
      console.log('doc.text pushed: ', doc.text)
      doc.user_name.push(req.body.user_name)
      doc.counter += 1
      // doc.prompt = doc.counter % 2 === 0 ? "Please illustrate this sentence: " : "Write a caption for this picture: ")
      // doc.next = req.next
      console.log('doc to go into database: ', doc);
      games.update({_id: doc._id}, doc, function (err, entry) {
        if (err) throw err
        var payload = doc
        payload.user_name = doc.user_name.pop()
        payload.channel_name = '@' + payload.user_name
        payload.text = doc.text.pop()
        console.log('payload', payload)
        unirest.post('https://hooks.slack.com/services/' + process.env.SLACK_KEYS)
        .header('Accept', 'application/json')
        .send(payload)
        .end(function (response) {
          console.log(response.body);
        });

        // console.log('final doc from post req', entry); // send message to req.next
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

      var payload = doc
      payload.user_name = doc.user_name.pop()
      payload.channel_name = '@' + payload.user_name
      payload.text = doc.text.pop()
      console.log('payload', payload)
      unirest.post('https://hooks.slack.com/services/' + process.env.SLACK_KEYS)
      .header('Accept', 'application/json')
      .send(payload)
      .end(function (response) {
        console.log(response.body);
      });

      res.redirect('/games')
    })
  }
})

router.get('/:id', function (req, res, next) {
  // console.log('show req.body', req.body);
  games.findOne({_id: req.params.id}, function (err, doc) {
    // console.log('from show route: ', doc);
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
