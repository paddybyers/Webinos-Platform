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

var tokenAuth = exports;

var path            = require('path');
var moduleRoot      = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies    = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot     = path.resolve(__dirname, '../' + moduleRoot.root.location);

var log            = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debugPzh;

tokenAuth.createAuthCounter = function(callback) {
    var authCounter = { status: false, code : "", timeout: "", guesses:0};
// 		status  : true, 
// 		code    : "DEBUG", 
// 		timeout : new Date("October 13, 2100 11:13:00"),
// 		guesses : 8
//	};

    authCounter.setExpectedCode = function(code, cb) {
	    "use strict";
	    var self = this;
    	    log(self.sessionId, 'INFO', "[PZH -"+self.sessionId+"] New PZP expected, code: " + code);
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
// 	    if (self.code === "DEBUG") {
// 	        //We don't unset if we're allowing debug additions.
// 	    } else {
	        log(self.sessionId, 'INFO', "[PZH -"+self.sessionId+"] No longer expecting PZP with code " + self.code);
		self.status = false;
	        self.code = null;
		self.timeout = null;
		self.guesses = 8;
//	    }
	    cb();
	}

	authCounter.isExpected = function(cb) {
	    "use strict";
	    var self = this;
	    
	    if (!self.status) {
	        log(self.sessionId, 'INFO', "[PZH -"+self.sessionId+"] Not expecting a new PZP");
	        cb(false);
	        return;
	    }
	    if (self.timeout < new Date()) {
	        log(self.sessionId, 'INFO', "[PZH -"+self.sessionId+"] Was expecting a new PZP, timed out.");
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
	    
	    log(self.sessionId, 'INFO', "[PZH -"+self.sessionId+"] Trying to add a PZP, code: " + newcode);
	    
	    if (!self.status) {
	        log(self.sessionId, 'INFO', "[PZH -"+self.sessionId+"] Not expecting a new PZP");
	        cb(false);
	        return;
	    }
	    if (self.code !== newcode) {
	        log(self.sessionId, 'INFO', "[PZH -"+self.sessionId+"] Was expecting a new PZP, but code wrong");
	        self.guesses = self.guesses - 1;
	        if (self.guesses <= 0) {
	            //no more guesses
	            log(self.sessionId, 'INFO', "[PZH -"+self.sessionId+"] Too many guesses, deleting code");
	            self.unsetExpected( function() { 
        	        cb(false);
    	        });           
	        }
	        cb(false);
	        return;
	    }
	        	    
	    if (self.timeout < new Date()) {
	        log(self.sessionId, 'INFO', "[PZH -"+self.sessionId+"]Was expecting a new PZP, code is right, but timed out.");
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
