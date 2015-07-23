var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Slaxophone' });
});
router.post('/update', function (req, res, next) {
  
})

module.exports = router;
