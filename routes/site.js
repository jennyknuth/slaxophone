var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.MONGOLAB_URI);
var games = db.get('games');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Slaxophone' });
});

router.get('/styleguide', function(req, res, next) {
  res.render('styleguide')
})

module.exports = router;
