
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
// this will be the route with object coming in from Slack, whether new or an update

router.get('/update', function (req, res, next) {
  res.render('games/test')
})
router.post('/update', function(req, res, next) { // want to have both new and update going to same route...bad idea?
  games.insert(req.body, function(err, doc) {
    res.redirect('/games')
  })
  // if (!req.gameId) { // if new game
  //   req.body.message = [req.body.message]
  //   req.body.email = [req.body.email]
  //   req.body.counter = 1
  //   req.body.draw = 'Please illustrate this sentence: '
  //   req.body.write = 'Write a caption for this picture: '
  //   games.insert(req.body, function (err, doc) {
  //     console.log('first update', doc)
  //     doc.gameId = doc._id // need to send this to the database!!! not in there
  //     games.update({_id: doc._id}, doc, function (err, doc) {
  //       console.log('final update from database', doc);
  //       res.redirect('/games')
  //     })
  //   })
  // } else { // if established game
  //   games.findOne({gameId: req.gameId}, function (err, doc) {
  //     doc.messages.push(req.message) // push message on to games.messages
  //     // doc.users.push(req.user)
  //     doc.couter += 1
  //     doc.next = req.next
  //     // doc.gameId = req.gameId
  //     games.update({_id: doc.gameId}, doc, function (err, doc) {
  //       if (err) throw err
  //       console.log('from post req', req.body); // send message to req.next
  //       res.redirect('/games')
  //     })
  //   })
  // }
})
router.get('/new', function (req, res, next) {
  games.findOne({_id: req.gameId}, function (err, doc) {
    console.log(doc);
    res.render('games/new', doc)
  })
})
router.get('/:id', function (req, res, next) {
  console.log('show req.body', req.body);
  games.findOne({_id: req.params.id}, function (err, doc) {
    console.log('from show route: ', doc);
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
