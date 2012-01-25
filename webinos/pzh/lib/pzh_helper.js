var helper = exports;

var path        = require('path');
var fs          = require('fs');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var webinosDemo  = path.resolve(__dirname, '../../../demo');

var qr           = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_qrcode.js'));
var crashMsg;

helper.addPzpQR = function (pzh, callback) {
	"use strict";
	qrcode.addPzpQRAgain(pzh, callback);
}

helper.connectedPzhPzp = function(pzh, callback) {
	"use strict";
	
	callback({ pzpList : pzh.connectedPzhIds , pzhList : pzp.connectedPzpIds });
}
	
helper.crashLog = function(pzh, callback) {
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

helper.setDebugStream = function(stream) {
	crashMsg = stream;
}

helper.debug = function(num, msg) {
	"use strict";
	var info = true; // Change this if you want no prints from session manager
	var debug = true;
	
	if(num === 1) {
		console.log('ERROR:' + msg);
		if(crashMsg != null) {
			crashMsg.write(msg);
			crashMsg.write('\n<br>');
		}
	} else if(num === 2 && info) {
		console.log('INFO:' + msg);		
	} else if(num === 3 && debug) {
		console.log('DEBUG:' + msg);
	}	
};
