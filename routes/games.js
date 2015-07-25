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

// this will be the route for slash command coming in from Slack, whether new or an update
router.post('/update', function(req, res, next) {
  console.log('req.body: ', req.body);
  // console.log('timestamp: ', req.body.timestamp);
  if (req.body.timestamp) { // if established game
    games.findOne({}, function (err, doc) { //local version
    // games.findOne({timestamp: req.body.timestamp}, function (err, doc) { // heroku version
      if (err) throw err
      console.log('game found', doc);
      console.log('doc.text found: ', doc.text)
      doc.text.push(req.body.text) // push message on to games.text
      console.log('doc.text pushed: ', doc.text)

      // if (birthday.memory) {
      //   birthdays.update({_id: url.params.id}, {"$push": { memory: birthday.memory}}, function (err, doc) {
      //     if (err) res.end('could not update memories')
      //   })
      // }
      // if (birthday.gifts) {
      //   birthdays.update({_id: url.params.id}, {"$push": { gifts: birthday.gifts}}, function (err, doc) {
      //     if (err) res.end('could not update gift ideas')
      //   })
      // }

      doc.user_name.push(req.body.user_name)
      doc.counter += 1
      // doc.prompt = doc.counter % 2 === 0 ? "Please illustrate this sentence: " : "Write a caption for this picture: ")
      // doc.next = req.next
      // doc.gameId = req.gameId
      console.log('doc to go into database: ', doc);
      games.update({_id: doc._id}, doc, function (err, entry) {
        if (err) throw err
        console.log('final doc from post req', entry); // send message to req.next
        res.redirect('/games')
      })
    })
  } else { // if new game
    console.log('game not found, starting new game', req.body);
    req.body.timestamp = new Date() // take this out for slack version
    req.body.text = [req.body.text]
    req.body.user_name = [req.body.user_name]
    req.body.counter = 1
    req.body.draw = 'Please illustrate this sentence: '
    req.body.write = 'Write a caption for this picture: '

    games.insert(req.body, function (err, doc) {
      console.log("new game in database with ts: ", doc)
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
