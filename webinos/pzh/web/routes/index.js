
      
module.exports = function(app){

    // Webinos dependencies
    var path         = require('path');
    var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
    var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
    var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
    var helper       = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_helper.js'));

    var express         = require('express'),
        util            = require('util'),
        crypto          = require('crypto'),
        fs              = require('fs'),
        passport        = require('passport'), 
        GoogleStrategy  = require('passport-google').Strategy;
  
    app.get('/', function(req, res){
      res.render('index', { user: req.user, isMutualAuth: false });
      //console.log(util.inspect(req.user));
      
      //console.log("index, app: \n" + util.inspect(app));

    });

    app.get('/account', ensureAuthenticated, function(req, res){
      res.render('account', { user: req.user });
    });


    app.get('/addpzp', ensureAuthenticated, function(req, res){

      qrcode.addPzpQR(app.Pzh, function(err, qr, text) {
          res.render('addpzp', { user: req.user, pzh: app.Pzh, isMutualAuth: false, qrcode: {img: qr, code: text} });
      });
      
    });
    app.get('/startpzh', ensureAuthenticated, function(req, res){
      res.render('startpzh', { user: req.user, pzh: app.Pzh, isMutualAuth: false});
    });
    app.get('/connectotherpzh', ensureAuthenticated, function(req, res){
      res.render('connectotherpzh', { user: req.user, pzh: app.Pzh, isMutualAuth: false});
    });
    app.get('/listpzh', ensureAuthenticated, function(req, res){
    
      helper.connectedPzhPzp(app.Pzh, function(list) {
      
        console.log(util.inspect(list.sessions));
      
        res.render('listpzh', { user: req.user, pzh: app.Pzh, isMutualAuth: false, pzhList : list.pzhList, pzpList : list.pzpList, pzpSessions: list.sessions});
      
      });
      
    });

    app.get('/crashlog', ensureAuthenticated,  function(req, res){
        helper.crashLog(app.Pzh, function(err, msg) {
            if (err !== null) {
                msg = "Ironically, the crashlog crashed - " + err;  
            }
            res.render('crashlog', { user: req.user, pzh: app.Pzh, isMutualAuth: false, crashlog: msg});          
            
        });    
    });
    app.get('/listallpzps', ensureAuthenticated, function(req, res){
      res.render('listallpzps', { user: req.user, pzh: app.Pzh, isMutualAuth: false});
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
      if (req.isAuthenticated()) { return next(); }
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
  
};



