/**
 * Module dependencies.
 */
var https = require('https');
var util = require('util');
var passport = require('passport');


/**
 * `Strategy` constructor.
 
 * Options:
 *	 - `apiKey`		 	 API key given by box
 *
 * Examples:
 *
 *		 passport.use(new BoxStrategy({ apiKey: 'abcdefg' }));
 *
 * @param {Object} options
 * @api public
 */
function Strategy(options) {
	options = options || {};
	if (!options.apiKey) throw new Error('BoxStrategy requires an apiKey option');
	this._apiKey = options.apiKey;
	this.name = 'box';
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);


/**
 * Authenticate request.
 *
 * This function must be overridden by subclasses.	In abstract form, it always
 * throws an exception.
 *
 * @param {Object} req
 * @param {Object} options
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
	var self = this;
	
	function error(e){
		console.log('error: ' + e.message);
	}
	
	if(req.query && req.query.auth_token){
		// form user profile
		var user = { auth_token: req.query.auth_token };
		var options = {
			host: 'www.box.com',
			path: '/api/1.0/rest?action=get_auth_token&api_key=' + this._apiKey + '&ticket=' + req.query.ticket,
			method: 'GET'
		};
		https.request(options, function(res){
			res.on('data', function (chunk) {
				chunk = chunk.toString().match('<user>(.*?)</user>')[1];
				var matches = chunk.match(/<.*?>.*?<\/.*?>/g);
				for(var i in matches){
					var match = matches[i].match('<(.*?)>(.*?)<');
					user[match[1]] = match[2];
				}
				self.success(user);
			});
		})
		.on('error', error)
		.end();
	}
	else{
		// get auth_token
		var options = {
			host: 'www.box.com',
			path: '/api/1.0/rest?action=get_ticket&api_key=' + this._apiKey,
			method: 'GET'
		};
		https.request(options, function(res){
			res.on('data', function (chunk) {
				var ticket = chunk.toString().match('<ticket>(.*?)</ticket>')[1];
				self.redirect('https://www.box.com/api/1.0/auth/' + ticket);
			});
		})
		.on('error', error)
		.end();
	}
}


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
