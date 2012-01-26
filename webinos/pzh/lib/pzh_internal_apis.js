var pzhapis     = exports;

var path        = require('path');
var fs          = require('fs');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var webinosDemo  = path.resolve(__dirname, '../../../demo');

var qr           = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_qrcode.js'));
var helper       = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_pzhapis.js'));


pzhapis.addPzpQR = function (pzh, callback) {
	"use strict";
	qrcode.addPzpQRAgain(pzh, callback);
}

pzhapis.connectedPzhPzp = function(pzh, callback) {
	"use strict";
	
	callback({ pzpList : pzh.connectedPzhIds , pzhList : pzh.connectedPzpIds, sessions: pzh.connectedPzp });
}
	
	
pzhapis.revoke = function(pzh, callback) {
    "use strict";        
    
}	

pzhapis.listAllPzp = function(pzh, callback) {
    "use strict";
        
}

pzhapis.restartPzh = function(pzh, callback) {
    "use strict";
        
}
	
pzhapis.getPzhCertificate = function(pzh, callback) {
    var msg = {name: app.Pzh.config.master.cert.name , 
		       cert: app.Pzh.config.master.cert.value};
    var payload = pzh.prepMsg(null, null, 'receiveMasterCert', msg);
    callback(payload);
}

pzhapis.addPzhCertificate = function(pzh, name, certificate, callback) {
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
