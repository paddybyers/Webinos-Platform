/*
 * This is an Express web server designed to provide an interface to the
 * PZH. This file configures the web server.
 * 
 * Author: John Lyle
 *
 */


/**
 * Module dependencies.
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
 * Arguments: port to use, whether to request client certificates, 
 *            domain name, http or https server, and then the 
 *            root path to certificates.
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
    
    var domainName = Pzh.server;

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
        // asynchronous verification, for effect...
        process.nextTick(function () {
          
          // To keep the example simple, the user's Google profile is returned to
          // represent the logged-in user.  In a typical application, you would want
          // to associate the Google account with a user record in your database,
          // and return that user instead.
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


    var app;

    
    app = express.createServer(options);
    

    app.configure(function(){
      "use strict";
      app.set('views', __dirname + '/views');
      app.set('view engine', 'ejs');
//      app.use(express.logger()); // turn on express logging for every page
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

    
    // An environment variable will switch between these two, but we don't yet.
    app.configure('development', function(){
      app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
    });

    app.configure('production', function(){
      app.use(express.errorHandler()); 
    });

    // Give the web application a copy of the PZH instance, so it can
    // do useful things with it.   
    app.Pzh = Pzh;
    app.checkLocalCert = checkLocalCert;
   
    // Set up the routes (./routes/index.js) depending on whether we have a PZH.
    var routes = setRoutes(app);
    
    app.listen(port);

    handleAppStart(app,next,isHTTP,checkLocalCert);
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
    if (isHTTP) callback(null, {});
    
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
        utils.debug(2, "WS Cert Paths exist, reading and returning");
        try {
            options.cert = fs.readFileSync(wsCertPath).toString();
            options.key  = fs.readFileSync(wsKeyPath).toString();
            callback(null,options);
        } catch (err) {
            utils.debug(1, "Error reading WS Certificates: " + err);
            callback(err);
        }
    }

}




