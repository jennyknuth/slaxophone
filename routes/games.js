
var db = require('monk')(process.env.MONGOLAB_URI);
var gifs = db.get('gifs');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
