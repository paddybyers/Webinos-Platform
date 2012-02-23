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


var pzhapis     = exports;

var path        = require('path');
var fs          = require('fs');
var util        = require('util');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var webinosDemo  = path.resolve(__dirname, '../../../demo');

var qrcode       = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_qrcode.js'));
var helper       = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_helper.js'));
var revoker      = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_revoke.js'));	
var session      = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_sessionHandling.js'));

pzhapis.addPzpQR = function (pzh, callback) {
	"use strict";
	qrcode.addPzpQRAgain(pzh, callback);
}

pzhapis.listZoneDevices = function(pzh, callback) {
	"use strict";
	
	revoker.listAllPzps(pzh, function(err1, pzpList) {
	    var result = {pzps: [], pzhs: []};
	    //PZPs
	    if (err1 === null) {
	        for (var i=0; i<pzpList.length; i++) {
                result.pzps.push(getPzpInfoSync(pzh, pzpList[i]));
	        } 
	    }
	    //Connected PZHs
	    revoker.listAllPzhs(pzh, function(err2, pzhList) {
	        if (err2 === null) {
                for (var j=0; j<pzhList.length; j++) {
                    result.pzhs.push(getPzhInfoSync(pzh, pzhList[j]));
                }
	        }
	        var err3 = { pzpError : err1, pzhError : err2 }; 
	        callback(err3, result);
	        
	    });
	});

}
	
function getPzpInfoSync(pzh, pzpId) {
    "use strict";    
    
    //find out whether we have this PZP in a session somewhere.
    var pzpConnected = false;
    var pzpName = pzpId;  
    for (var i=0; i< pzh.connectedPzpIds.length; i++) {
        //session IDs append the PZH to the front of the PZP ID.
        var splitId = pzh.connectedPzpIds[i].split("/");
        if (splitId.length > 1 && splitId[1] !== null) {
            if (splitId[1] === pzpId) {
                pzpConnected = true;
                pzpName = pzh.connectedPzpIds[i];
            }
        }
    }
    
    return {
        id          : pzpId,
        cname       : pzpName,
        isConnected : pzpConnected
    };
}

function getPzhInfoSync(pzh, pzhId) {
    "use strict";    
    if (pzhId === pzh.config.common.split(':')[0]) {
        //we know that this PZH is alive
        return {
            id : pzhId,
            url: "",
            cname: pzhId + " (Your PZH)",
            isConnected: true
        };
        
        
    } else {
 
        return {
            id          : pzhId,
            url         : null,
            cname       : "unknown",
            isConnected : true
        };
    }
}


pzhapis.revoke = function(pzh, pzpid, callback) {
    "use strict";        
    revoker.revokePzp(pzpid, pzh, callback);
}	


pzhapis.restartPzh = function(pzh, callback) {
    "use strict";
    session.restartPzh(pzh, callback);
}
	
pzhapis.getPzhCertificate = function(pzh, callback) {
    "use strict";
    var msg = {name: pzh.config.master.cert.name , 
		       cert: pzh.config.master.cert.value};
    var payload = pzh.prepMsg(null, null, 'receiveMasterCert', msg);
    callback(payload);
}

pzhapis.addPzhCertificate = function(pzh, name, certificate, callback) {
    "use strict";
    try { 
        fs.writeFile(pzh.config.pzhOtherCertDir+'/'+certname, certvalue, function() {
            pzh.conn.pair.credentials.context.addCACert(certvalue);
            callback();
        });
    } catch (error) {
        helper.debug(1, "PZH couldn't save an incoming PZH certificate" + error);
        callback(error);
    }
}	
	
pzhapis.crashLog = function(pzh, callback) {
	"use strict";
	
	try {
	    var logFile = webinosDemo + '/'+pzh.sessionId + '_crash.txt';
		var clog = fs.readFileSync(logFile, 'utf8');
		callback(null,clog);
	} catch (err) {
		helper.debug(1, 'PZH ('+pzh.sessionId+') Error creating crashlog ' + err);
		callback(err);
	}
}


