
/*******************************************************************************
*  Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*     http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
*******************************************************************************/


/* 
 *   webinos Personal Zone Hub web interface routes file
 *   
 *   This page contains the routes we're exposing to the PZH web interface
 *   for managing the personal zone hub.  E.g. adding new devices, revocation,
 *   showing device status, etc.
 *
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
    var path            = require('path'),
        util            = require('util'),
        crypto          = require('crypto'),
        fs              = require('fs'),
        moduleRoot      = require(path.resolve(__dirname, '../dependencies.json')),
        webinosRoot     = path.resolve(__dirname, '../' + moduleRoot.root.location),
        dependencies    = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json')),
        pzhapis         = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_internal_apis.js')),
        utils           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')),
        express         = require('express'),
        passport        = require('passport'), 
        GoogleStrategy  = require('passport-google').Strategy,
        YahooStrategy   = require('passport-yahoo').Strategy;
  
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


    app.get('/auth/google', 
      passport.authenticate('google', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect('/');
    });


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
        // never called
      });

    app.get('/auth/yahoo/return', 
      passport.authenticate('yahoo', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect('/');
      });
    
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



