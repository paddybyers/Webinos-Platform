
      
module.exports = function(app){

    // Webinos dependencies
    var path         = require('path');
    var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
    var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
    var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
    var pzhapis      = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_internal_apis.js'));
    var utils        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
       
    
    var express         = require('express'),
        util            = require('util'),
        crypto          = require('crypto'),
        fs              = require('fs'),
        passport        = require('passport'), 
        GoogleStrategy  = require('passport-google').Strategy;
        YahooStrategy   = require('passport-yahoo').Strategy;
  
    //for testing.  May be removed.
    function fakeUser() {
        return {
            from: "google",
            identifier: "Fake ID",
            displayName: "Fake user",
            emails : ["fake@example.com"]
        }
    }
  
    app.get('/', function(req, res){
      res.render('index', { user: req.user, isMutualAuth: false });

      //var fake = fakeUser();
      //res.render('index', { user: fake, isMutualAuth: false });
      //console.log(util.inspect(req.user));
      
      //console.log("index, app: \n" + util.inspect(app));

    });

    app.get('/account', ensureAuthenticated, function(req, res){
      res.render('account', { user: req.user, isMutualAuth: false });
    });

    app.get('/addpzp', ensureAuthenticated, function(req, res){

      pzhapis.addPzpQR(app.Pzh, function(err, qr, text) {
          res.render('addpzp', { user: req.user, pzh: app.Pzh, isMutualAuth: false, qrcode: {img: qr, code: text} });
      });
      
    });
        
    app.get('/zone', ensureAuthenticated, function(req, res){    


      pzhapis.listZoneDevices(app.Pzh, function(err, list) {
        
        res.render('zone', { user: req.user, pzh: app.Pzh, isMutualAuth: false, devices: list });
                
      });
      
    });
    
    app.get('/revoke/pzp/:id', ensureAuthenticated, function(req, res){    
      var result = null;
      pzhapis.revoke(app.Pzh, req.params.id, function(err) {
        if (typeof err === 'undefined') {
            //todo force a restart.
            result = { success: true };            
            res.render('revoke', {user: req.user, isMututalAuth: false, revoke: result});

        } else {
            result = { success: false, reason: err };
            res.render('revoke', {user: req.user, isMututalAuth: false, revoke: result});
        }
      });
    });
    
    app.get('/revoke/pzh/:id', ensureAuthenticated, function(req, res) {
      var result = null;
      result = { success: false, reason: "not supported" };        
      res.render('revoke', {user: req.user, isMututalAuth: false, revoke: result});      
    });
    
    app.get('/restart', ensureAuthenticated, function(req,res) {
        pzhapis.restartPzh(app.Pzh, function(err, result, newpzh) {
            if (err) {
                res.render('restart', {user: req.user, isMututalAuth: false, restart : { success: false, reason: err}});      
            } else {               
                app.Pzh = newpzh;
                res.render('restart', {user: req.user, isMututalAuth: false, restart : { success: true, reason: "We're awesome"}});                  
            }
        });   
    });

    app.get('/crashlog', ensureAuthenticated,  function(req, res){
        pzhapis.crashLog(app.Pzh, function(err, msg) {
            if (err !== null) {
                msg = "Ironically, the crashlog crashed - " + err;  
            }
            res.render('crashlog', { user: req.user, pzh: app.Pzh, isMutualAuth: false, crashlog: msg});          
            
        });    
    });
    
    //This is an unauthenticated action.  Anyone may obtain my certificate this way.    
    app.post('/certificate', function(req, res){
        // add incoming certificate	    
        var certname = req.body.message.name;
        var certvalue = req.body.message.cert;
        pzhapis.addPzhCertificate(app.Pzh, certname, certvalue, function(err) {
            //Handle error;
        });
        
        //send outgoing certificate
        pzhapis.getPzhCertificate(app.Pzh, function(payload) {
            res.json(payload);
        });
         
    });

    app.get('/certificate', function(req, res){
        //send outgoing certificate
        pzhapis.getPzhCertificate(app.Pzh, function(payload) {
            res.json(payload);
        }); 
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



