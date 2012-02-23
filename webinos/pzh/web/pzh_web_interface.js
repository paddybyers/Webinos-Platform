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
 * This is an Express web server designed to provide an interface to the
 * PZH. This file configures the web server.
 * 
 *
 */


var express         = require('express'),
    util            = require('util'),
    path            = require('path'),
    crypto          = require('crypto'),
    fs              = require('fs'),
    passport        = require('passport'), 
    YahooStrategy   = require('passport-yahoo').Strategy,
    GoogleStrategy  = require('passport-google').Strategy;

var moduleRoot      = require(path.resolve(__dirname, '../dependencies.json')),
    dependencies    = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json')),
    webinosRoot     = path.resolve(__dirname, '../' + moduleRoot.root.location),
    utils           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')),
    webCert         = require(path.join(webinosRoot, dependencies.pzh.location, 'web/pzh_web_certs.js'));

var pzhweb          = exports; 

/*
 * This is how you start the server programmatically.
 * Arguments: port to use, 
 *            whether to request client certificates, 
 *            http or https server, 
 *            the Pzh (which ought to be instantiated)
 *          
 */
pzhweb.startServer = function(port, checkLocalCert, isHTTP, Pzh, next) {
    "use strict";
    getSSLOptions(Pzh, isHTTP, checkLocalCert, function(err, options) {
        if (err === null) {
            createServer(port, checkLocalCert, isHTTP, Pzh, options, next);
        } else {
            utils.debug(2, err);       
            utils.debug(2, "Failed to read certificates for web server");                   
        }
    });
}

function createServer(port, checkLocalCert, isHTTP, Pzh, options, next) {
    "use strict";
    var domainName = Pzh.server;

    //configure the authentication engine and user binding
    passport = createPassport(domainName, port, isHTTP);

    //configure the express app middleware
    var app = createApp(options, passport);

    // Give the web application a copy of the PZH instance, so it can
    // do useful things with it.   
    app.Pzh = Pzh;
    app.checkLocalCert = checkLocalCert;
   
    // Set up the routes (./routes/index.js) depending on whether we have a PZH.
    var routes = setRoutes(app);
    
    app.listen(port);
    
    //some very basic console output and calling the callback.
    handleAppStart(app,next,isHTTP,checkLocalCert);
}

function createApp(options, passport) {
    "use strict";
    var app = express.createServer(options);

    app.configure(function(){
      "use strict";
      app.set('views', __dirname + '/views');
      app.set('view engine', 'ejs');
      app.use(express.bodyParser());
      app.use(express.methodOverride());
      app.use(express.cookieParser());
      var sessionSecret = crypto.randomBytes(40).toString("base64");
      app.use(express.session({ secret: sessionSecret }));
      app.use(passport.initialize());
      app.use(passport.session());    
      app.use(app.router);
      app.use(express.static(__dirname + '/public'));
    });

    app.configure('development', function(){
      app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
    });

    return app;
}

function createPassport(domainName, port, isHTTP) {
    "use strict";
    /* No clever user handling here yet */
    passport.serializeUser(function(user, done) {
      done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
      done(null, obj);
    });

    if (isHTTP) {
        var prefix = "http";
    } else {
        var prefix = "https";
    }
    
    // Use the GoogleStrategy within Passport.
    //   Strategies in passport require a `validate` function, which accept
    //   credentials (in this case, an OpenID identifier and profile), and invoke a
    //   callback with a user object.
    passport.use(new GoogleStrategy({
        returnURL: prefix + '://' + domainName + ':' + port + '/auth/google/return',
        realm: prefix + '://' + domainName + ':' + port + '/'
      },
      function(identifier, profile, done) {
        "use strict";
        process.nextTick(function () {
         
          profile.from = "google";
          profile.identifier = identifier;
          return done(null, profile);
        });
      }
    ));

    passport.use(new YahooStrategy({
        returnURL: prefix + '://' + domainName + ':' + port + '/auth/yahoo/return',
        realm: prefix + '://' + domainName + ':' + port + '/'
      },
      function(identifier, profile, done) {
        "use strict";
        process.nextTick(function () {
          profile.from = "yahoo";
          profile.identifier = identifier;
          return done(null, profile);
        });
      }
    ));
    return passport;
}


function setRoutes(app) {
    "use strict";
    if (typeof app.Pzh === 'undefined') {
        return null;
    } else {
        return require('./routes')(app);
    }
}

function handleAppStart(app, next, isHTTP, checkLocalCert) {
    "use strict";   
    if (app.address() === null) {
        //failed.  Probably the wrong port.
        console.log("ERROR! Failed to start web interface - are you running on the right port?");
        next(false);
    } else {
    
        if (isHTTP) {
            console.log("HTTP-ONLY  PZH Web server listening on port " + app.address().port);
        } else {
            console.log("HTTPS      PZH Web server listening on port " + app.address().port);
        }
        if (checkLocalCert) {
            console.log("Requesting local PZP certificate");
        }
        next(true);
    }
}


function getSSLOptions(Pzh, isHTTP, checkLocalCert, callback) {
    "use strict";
    if (isHTTP) {
        callback(null, {});
    }
    
    var wsCertPath = path.join(Pzh.config.pzhCertDir, Pzh.config.webserver.cert.name);
    var wsKeyPath = path.join(Pzh.config.pzhKeyDir, Pzh.config.webserver.key.name);    
    var options = { 
        ca          : Pzh.config.master.cert.value,
	    crl         : Pzh.config.master.crl.value,
	    requestCert : true,
	    rejectUnauthorised : checkLocalCert
    };

    if (!path.existsSync(wsCertPath)) {
        //assume this means that we need to generate both.
        webCert.createWSCert(Pzh, function(err, wscert, wskey) {
            if (err === null) {
                options.cert =  wscert;
                options.key  = wskey;
                callback(null,options);
            } else {
                utils.debug(1, "Error! WSCert: " + err);
                callback(err);
            }
        });
    } else {
        try {
            options.cert = fs.readFileSync(wsCertPath).toString();
            options.key  = fs.readFileSync(wsKeyPath).toString();
        } catch (err) {
            utils.debug(1, "Error reading WS Certificates: " + err);
            callback(err);
            return;
        }
        callback(null,options);
    }

}



