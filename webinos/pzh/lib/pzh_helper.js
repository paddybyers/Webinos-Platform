var helper = exports;

var path        = require('path');
var fs          = require('fs');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var webinosDemo  = path.resolve(__dirname, '../../../demo');

var qr           = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_qrcode.js'));
var crashMsg;

helper.addPzpQR = function (instance, connection) {
	"use strict";
	qr.addPzpQR(instance[0], connection);
}

helper.connectedPzhPzp = function(instance, callback) {
	"use strict";
	var i;
	for( i = 0; i < instance.length; i += 1) {
		var message = {name: instance[i].sessionId, pzpId: instance[i].connectedPzpIds, pzhId: instance[i].connectedPzhIds};
		var payload = { status: 'listPzh', message: message};
		try {
			var msg = {type: 'prop', payload: payload};
			callback(msg);
		} catch (err) {
			helper.debug(1, 'PZH ('+pzh.sessionId+') Error sending connectedPzp/Pzh to WebClient ' + err);			
			return;
		}
	}
}
	
helper.crashLog = function(instance, callback) {
	"use strict";
	var i;
	for( i = 0; i < instance.length; i += 1) {
		try {
			var message = {name: instance[i].sessionId, log: fs.readFileSync(webinosDemo + '/'+instance[i].sessionId + '_crash.txt').toString()};
			var payload = {status : 'crashLog', message : message};
			var msg = {type: 'prop', payload: payload};
			callback(msg);
		} catch (err) {
			helper.debug(1, 'PZH ('+instance[i].sessionId+') Error sending crashLog to WebClient ' + err);
			return;
		}
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
