/*
*   webinos Personal Zone Hub web interface routes file
*
*   This page contains the routes we're exposing to the PZH web interface
*   for managing the personal zone hub.  E.g. adding new devices, revocation,
*   showing device status, etc.
*
*   Original author: John Lyle (john.lyle@cs.ox.ac.uk)
*
*
* TODO - Integrate with a real strategy for managing user identity.
*        Currently we have an identity but we don't check anything about it.
*
* TODO - We're requesting a client certificate, but we don't change behaviour
*        if one isn't presented.  This might remove some functionality in the
*        future.
*
* TODO - integrate with the policy system rather than this adhoc
*        "ensureAuthenticated" approach.
*/

module.exports = function(app){
"use strict";
var path        = require('path'),
util            = require('util'),
crypto          = require('crypto'),
fs              = require('fs'),
moduleRoot      = require(path.resolve(__dirname, '../dependencies.json')),
webinosRoot     = path.resolve(__dirname, '../' + moduleRoot.root.location),
dependencies    = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json')),
pzhapis         = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_internal_apis.js')),
utils           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')),
Pzh             = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_sessionHandling.js')),
express         = require('express'),
passport        = require('passport'),
GoogleStrategy  = require('passport-google').Strategy,
YahooStrategy   = require('passport-yahoo').Strategy,
ax              = require(path.join(webinosRoot, dependencies.pzh.location, 'web/openid-ax.js')), // ADDED BY POLITO
farm			= require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_farm.js')); // ADDED BY POLITO

app.get('/', function(req, res){
	res.render('index', { user: req.user, isMutualAuth: false });
});

app.get('/account', ensureAuthenticated, function(req, res){
	res.render('account', { user: req.user, isMutualAuth: false });
});

app.get('/addpzp', ensureAuthenticated, function(req, res){
	pzhapis.addPzpQR(app.Pzh, function(err, qr, text) {
		res.render('addpzp', {
		user: req.user,
		pzh: app.Pzh,
		isMutualAuth: false,
		qrcode: {img: qr, code: text}
		});
	});
});

app.get('/addpzh', function(req, res) {
	res.render('addpzh', { user: req.user });
});

app.post('/addpzhcert', function(req, res){
	var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon="+req.body.name+"\nemail=internal@webinos.org\ndays=180\n"
	var pzhModules = [
		{name: "get42", params: [99]},
		{name: "events", param: {}}
	];

	Pzh.addPzh(req.body.host, contents, pzhModules, function(result,instance) {
		if (result) {
			res.render('login', {user: req.user});
		} else {	
			res.render('addpzh', {
				user: req.user,
				pzh: instance,
				isMutualAuth: false,
				status: result
			});
		}
	});
});

app.get('/zone', ensureAuthenticated, function(req, res){
	pzhapis.listZoneDevices(app.Pzh, function(err, list) {
		res.render('zone', {
		user: req.user,
		pzh: app.Pzh,
		isMutualAuth: false,
		devices: list
		});
	});
});

app.get('/revoke/pzp/:id', ensureAuthenticated, function(req, res){
	"use strict";
	var result = null;
	pzhapis.revoke(app.Pzh, req.params.id, function(err) {
	if (typeof err === 'undefined') {
		//todo force a restart.
		result = { success: true };
		res.render('revoke', {
		user: req.user,
		isMututalAuth: false,
		revoke: result
		});
	} else {
		result = { success: false, reason: err };
		res.render('revoke', {user: req.user,
		isMututalAuth: false,
		revoke: result});
	}
	});
});

app.get('/revoke/pzh/:id', ensureAuthenticated, function(req, res) {
	"use strict";
	var result = null;
	result = { success: false, reason: "not supported" };
	res.render('revoke', {
		user: req.user,
		isMututalAuth: false,
		revoke: result
	});
});

app.get('/restart', ensureAuthenticated, function(req,res) {
	"use strict";
	pzhapis.restartPzh(app.Pzh, function(err, result, newpzh) {
		if (err) {
			res.render('restart', {
				user: req.user,
				isMututalAuth: false,
				restart : {
				success: false,
				reason: err
				}
			});
		} else {
			app.Pzh = newpzh;
			res.render('restart', {
				user: req.user,
				isMututalAuth: false,
				restart : {
				success: true,
				reason: null
				}
			});
		}
	});
});

app.get('/crashlog', ensureAuthenticated,  function(req, res){
	pzhapis.crashLog(app.Pzh, function(err, msg) {
		if (err !== null) {
			msg = "Ironically, the crashlog crashed - " + err;
		}
		res.render('crashlog', {
			user: req.user,
			pzh: app.Pzh,
			isMutualAuth: false,
			crashlog: msg
		});

	});
});

app.post('/certificate_fetch', function(req, res){
	pzhapis.addPzhCertificate(app.Pzh, req.body.pzh_addr, function(result) {
		res.render('certificate', {
			user: req.user,
			pzh : app.Pzh,
			isMutualAuth: false,
			status: result
		});
	});
});

app.get('/certificate', function(req, res){
	//send outgoing certificate
	res.render('certificate', {user: req.user});	

});

app.get('/login', function(req, res){
	res.render('login', { user: req.user });
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve redirecting
//   the user to google.com.  After authenticating, Google will redirect the
//   user back to this application at /auth/google/return
app.get('/auth/google',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/');
});

// GET /auth/google/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/return',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/');
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/auth/yahoo',
	passport.authenticate('yahoo'),
	function(req, res){
	// The request will be redirected to Yahoo for authentication, so
	// this function will not be called.
});

app.get('/auth/yahoo/return',
	passport.authenticate('yahoo', { failureRedirect: '/login' }),
	function(req, res) {
	// Successful authentication, redirect home.
		res.redirect('/');
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();		
	}
	res.redirect('/login');
}
/*
function ensureHasClientCert(req, res, next) {
//TODO: How do we know a client has a certificate?
if (req.clientHasCert) {
	return next();
} else {
	res.redirect('/login');
}
}
*/

// BEGIN OF POLITO MODIFICATIONS
    app.get('/auth/google-ax', function(req, res) {
		console.log(ax.relyingParty);
		ax.relyingParty.authenticate("http://www.google.com/accounts/o8/id", false, function(error, authUrl) {
			if(error || !authUrl) {
				res.redirect('/');
            }
            else {
				res.redirect(authUrl);
            }
		});
	});

    app.get('/auth/yahoo-ax', function(req, res) {
		console.log(ax.relyingParty);
		ax.relyingParty.authenticate("https://me.yahoo.com/", false, function(error, authUrl) {
			if(error || !authUrl) {
				res.redirect('/');
            }
            else {
				res.redirect(authUrl);
            }
		});
	});

    app.get('/verify', function(req, res) {
		ax.relyingParty.verifyAssertion(req, function(error, result) {
			var user = {};

			console.log(result);
			if (!error && result.authenticated === true) {
				user.identifier = result.claimedIdentifier;
				if (result.claimedIdentifier.search("google") > -1) {
					user.from = 'google';
				}
				else if (result.claimedIdentifier.search("yahoo") > -1) {
					user.from = 'yahoo';
				}

				if (result.fullname) {
					user.fullname = result.fullname;
					if (user.from === 'yahoo') {
						// Yahoo attribute exchange returns the full name
						user.displayName = result.fullname;
						user.name = {
							givenName: result.fullname.split(' ')[0],
							familyName: result.fullname.split(' ')[1]
						};
					}
				}
				if (result.firstname) {
					user.firstname = result.firstname;
				}
				if (result.lastname) {
					user.lastname = result.lastname;
				}
				if (result.firstname && result.lastname && user.from === 'google') {
					user.name = {
						givenName: result.firstname,
						familyName: result.lastname
					};
					// Google attribute exchange returns first name and lastname
					user.displayName = result.firstname + ' ' + result.lastname;
				}
				if (result.country) {
					user.country = result.country;
				}
				if (result.language) {
					user.language = result.language;
				}
				if (result.email) {
					user.emails = [{value: result.email}];
				}
				if (result.nickname) {
					user.nickname = result.nickname;
				}
				if (result.image) {
					user.image = result.image;
				}
				if (result.gender) {
					user.country = result.gender;
				}

				if (user.name && user.name.givenName) {
					req.session.passport.user = user;
					app.Pzh = farm.getPzhInstance(ax.relyingParty.returnUrl.split(':')[1].split('//')[1] + '/' + user.name.givenName, user);
				}
				else {
					console.log("User given name is missing");
				}
			}
			res.redirect('/');
		});
	});
// END OF POLITO MODIFICATIONS

};



