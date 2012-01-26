var pzhapis     = exports;

var path        = require('path');
var fs          = require('fs');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var webinosDemo  = path.resolve(__dirname, '../../../demo');

var qrcode       = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_qrcode.js'));
var helper       = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_helper.js'));
var revoker      = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_revoke.js'));	


pzhapis.addPzpQR = function (pzh, callback) {
	"use strict";
	qrcode.addPzpQRAgain(pzh, callback);
}

pzhapis.listZoneDevices = function(pzh, callback) {
	"use strict";
	
	console.log("certDir: ", pzh.config.pzhCertDir);
	
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
	/*	
	callback({ 
	    allPzps         : revoker.listAllPzps(pzh, callback);
	    connectedPzpIds : pzh.connectedPzpIds , 
	    connectedPzhIds : pzh.connectedPzhIds , 
	    sessions        : pzh.connectedPzp 
	});
	*/
}
	
function getPzpInfoSync(pzh, pzpId) {
    "use strict";    
    return {
        id          : pzpId,
        cname       : "unknown PZP CNAME",
        isConnected : true
    };
}

function getPzhInfoSync(pzh, pzhId) {
    "use strict";    
    return {
        id          : pzhId,
        cname       : "unknown PZH CNAME",
        isConnected : true
    };
}


pzhapis.revoke = function(pzh, pzpid, callback) {
    "use strict";        
    revoker.revokePzp(pzh, pzpid, callback);
}	


pzhapis.restartPzh = function(pzh, callback) {
    "use strict";
    //TODO
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
