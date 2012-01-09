
var tokenAuth = exports;

var path = require('path');
var utils = require(path.resolve(__dirname, '../../pzp/lib/session_common.js'));

tokenAuth.createAuthCounter = function(callback) {

    var authCounter = {       
        status  : true, 
		code    : "DEBUG", 
		timeout : new Date("October 13, 2100 11:13:00"),
		guesses : 8
	};


    authCounter.setExpectedCode = function(code, cb) {
	    "use strict";
	    utils.debug(2, "New PZP expected, code: " + code);
	    var self = this;
	    self.status = true;
	    self.code = code;
	    var d = new Date(); 
	    d.setMinutes(d.getMinutes() + 10); //Timeout of ten minutes?  Should this be a config option?
	    self.timeout = d;
	    self.guesses = 8; //Allow 8 guesses
	    cb();
	}
	
	authCounter.unsetExpected = function(cb) {
	    "use strict";
	    var self = this;
	    if (self.code === "DEBUG") {
	        //We don't unset if we're allowing debug additions.
	    } else {
	        utils.debug(2,"No longer expecting PZP with code " + self.code);
    	    self.status = false;
	        self.code = null;
    	    self.timeout = null;
    	    self.guesses = 8;
	    }
	    cb();
	}

    authCounter.isExpected = function(cb) {
	    "use strict";
	    var self = this;
	    
	    if (!self.status) {
	        utils.debug(2, "Not expecting a new PZP");
	        cb(false);
	        return;
	    }
	    if (self.timeout < new Date()) {
	        utils.debug(2, "Was expecting a new PZP, timed out.");
	        self.unsetExpected( function() { 
        	        cb(false);
	        });
	        return;
	    } 	    
	    
	    cb ( self.status && 
	            (self.timeout > new Date()) );
	}
	
	authCounter.isExpectedCode = function(newcode, cb) {
	    "use strict";
	    var self = this;
	    
	    utils.debug(2, "Trying to add a PZP, code: " + newcode);
	    
	    if (!self.status) {
	        utils.debug(2, "Not expecting a new PZP");
	        cb(false);
	        return;
	    }
	    	    
	    if (self.code !== newcode) {
	        utils.debug(2, "Was expecting a new PZP, but code wrong");
	        self.guesses = self.guesses - 1;
	        if (self.guesses <= 0) {
	            //no more guesses
	            utils.debug(2, "Too many guesses, deleting code");
	            self.unsetExpected( function() { 
        	        cb(false);
    	        });           
	        }
	        cb(false);
	        return;
	    }
	        	    
	    if (self.timeout < new Date()) {
	        utils.debug(2, "Was expecting a new PZP, code is right, but timed out.");
	        self.unsetExpected( function() { 
    	        cb(false);
	        });
	        return;
	    }  
    
	    cb( self.status && self.code === newcode && 
	        (self.timeout > new Date()) );
	}
	
	callback(authCounter);

}




