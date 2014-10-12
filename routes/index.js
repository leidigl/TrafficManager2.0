
/*
 * GET home page
 */

exports.index = function(req, res) {
  res.render('index', { title: 'TrafficManager2.0' });
};

/*
 * GET game page
 */

exports.game = function(req, res) {
  res.render('game', { title: 'TrafficManager2.0' });
};