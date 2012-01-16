var helper = exports;

var path = require('path');

var qr = require(path.resolve(__dirname, 'webinosQR.js'));

helper.addPzpQR = function (connection) {
	"use strict";
	qr.addPzpQR(instance[0], connection);
}

helper.connectedPzhPzp = function(instance, connection) {
	"use strict";
	var i;
	for( i = 0; i < instance.length; i += 1) {
		var message = {name: instance[i].sessionId, pzpId: instance[i].connectedPzpIds, pzhId: instance[i].connectedPzhIds};
		var payload = { status: 'listPzh', message: message};
		try {
			var msg = {type: 'prop', payload: payload};
			connection.sendUTF(JSON.stringify(msg));
		} catch (err) {
			utils.debug(1, 'PZH ('+pzh.sessionId+') Error sending connectedPzp/Pzh to WebClient ' + err);
			return;
		}
	}
}
	
helper.crashLog = function(instance, connection) {
	"use strict";
	var i;
	for( i = 0; i < instance.length; i += 1) {
		var message = {name: instance[i].sessionId, log: fs.readFileSync(instance[i].sessionId + '_crash.txt').toString()};
		var payload = {status : 'crashLog', message : message};
		try {
			var msg = {type: 'prop', payload: payload};
			connection.sendUTF(JSON.stringify(msg));
		} catch (err) {
			utils.debug(1, 'PZH ('+pzh.sessionId+') Error sending crashLog to WebClient ' + err);
			return;
		}
	}
}
