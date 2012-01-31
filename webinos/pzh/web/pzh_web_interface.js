/*
 * This is an Express web server designed to provide an interface to the
 * PZH.  
 * 
 * Author: John Lyle
 *
 */


/**
 * Module dependencies.
 */
var express         = require('express'),
    util            = require('util'),
    crypto          = require('crypto'),
    fs              = require('fs'),
    passport        = require('passport'), 
    YahooStrategy   = require('passport-yahoo').Strategy;
    GoogleStrategy  = require('passport-google').Strategy;

var pzhweb          = exports; 

/*
 * This is how you start the server programmatically.
 * Arguments: port to use, whether to request client certificates, domain name, http or https server, and then the root path to certificates.
 * 
 */
pzhweb.startServer = function(port, checkLocalCert, domainName, isHTTP, certPath, Pzh, next) {


    /* No clever user handling here */
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
        process.nextTick(function () {
          profile.from = "yahoo";
          profile.identifier = identifier;
          return done(null, profile);
        });
      }
    ));


    var app = express.createServer();


    if (!isHTTP) {
        var options = { 
            cert        : fs.readFileSync(certPath + "/cert/pzh_WebinosPzh_conn_cert.pem"),
            key         : fs.readFileSync(certPath + "/keys/pzh_WebinosPzh_conn_key.pem"),
            ca          : fs.readFileSync(certPath + "/cert/pzh_WebinosPzh_master_cert.pem"),
		    crl         : fs.readFileSync(certPath + "/cert/pzh_WebinosPzh_master_cert.crl"),
		    requestCert : false, // always allow connection without local certificate 
		    rejectUnauthorized : checkLocalCert
        };
        var app = express.createServer(options);
    } else {
        var app = express.createServer();
    }


    app.configure(function(){
      app.set('views', __dirname + '/views');
      app.set('view engine', 'ejs');
//      app.use(express.logger());
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
      //app.use(express.errorHandler()); 
    });

    app.configure('production', function(){
      app.use(express.errorHandler()); 
    });

    // Routes

    app.Pzh = Pzh;
    app.checkLocalCert = checkLocalCert;
    var routes = require('./routes')(app);

    app.listen(port);

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
