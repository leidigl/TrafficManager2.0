
/*
 * GET home page
 */

exports.main = function(req, res) {
  res.render('main', { title: 'TrafficManager2.0' });
};

/*
* GET orga page
*/

exports.orga = function(req, res) {
	res.render('orga', { title: 'TrafficManager2.0' });
};

/*
 * GET game page
 */

exports.game = function(req, res) {
  res.render('game', { title: 'TrafficManager2.0' });
};