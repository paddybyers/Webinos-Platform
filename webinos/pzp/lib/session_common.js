/**
* @description Session common has functions that are used by both Pzh and Pzp
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
*/
var dns = require('dns');
var net = require('net');
var path = require('path');
var fs = require('fs');
	
var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var webinosDemo  = path.resolve(__dirname, '../../../demo');
var	validation = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_schema.js')); // ADDED BY POLITO

		
if (typeof exports !== "undefined") {
	var rpc       = require(path.join(webinosRoot, dependencies.rpc.location));
}


var debug = function(num, msg) {
	"use strict";
	var info = true; // Change this if you want no prints from session manager
	var debug = true;
	var num 
	if(num === 'ERROR') {
		console.log('ERROR: ' + msg);	
	} else if(num === 2 && info) {
		console.log('INFO: ' + msg);		
	} else if(num === 3 && debug) {
		console.log('DEBUG: ' + msg);
	}	
};

// This is a device id through which we recognize device
var getId = function (self, callback) {
	"use strict";
	console.log('PZ Common: Selected Platform - ' + process.platform);	
	callback.call(self, process.platform);
};


/** @desription It removes the connected PZP/Pzh details.
 */
exports.removeClient = function(self, conn) {
	"use strict";
	var i, delId, delPzhId;
	
	for (i in self.connectedPzp) {
		if(self.connectedPzp.hasOwnProperty(i)) {
			if(conn.socket._peername.address === self.connectedPzp[i].address) {
				delId = i;
				delete self.connectedPzp[i];
			}
		}
	}
	
	if (typeof delId !== "undefined") {
		for ( i = 0 ; i < self.connectedPzpIds.length; i += 1) {
			if ( delId === self.connectedPzpIds[i]) {
				//delete self.connectedPzpIds[i];
				self.connectedPzpIds.splice(i, 1);
				return delId;
			}
		}
	}
	
	for (i in self.connectedPzh) {
		if(self.connectedPzh.hasOwnProperty(i)) {
			if(conn.socket._peername.address === self.connectedPzh[i].address) {
				delPzhId = i;
				self.connectedPzh.splice(i, 1);
				//delete self.connectedPzh[i];
			}
		}
	}
	if (typeof delIPzhId !== "undefined") {
		for ( i = 0 ; i < self.connectedPzhIds.length; i += 1) {
			if ( delPzhId === self.connectedPzhIds[i]) {
				//delete self.connectedPzhIds[i];
				self.connectedPzhIds.splice(i, 1);
				return delPzhId;
			}
		}
	}
	
	
};

exports.processedMsg = function(self, data, dataLen, callback) {
	"use strict";
	var msg = data.toString('utf8');
	if(msg[0] ==='#' && msg[msg.length-dataLen] === '#') {
		msg = msg.split('#');
		/*if(checkSchema(msg[1]) === false) */{
			var parse = JSON.parse(msg[1]);

			// BEGIN OF POLITO MODIFICATIONS
			var valError = validation.checkSchema(parse);
			if(valError === false) { // validation error is false, so validation is ok
				console.log('Received recognized packet ' + JSON.stringify(msg));
			}
			else if (valError === true) {
				// for debug purposes, we only print a message about unrecognized packet
				// in the final version we should throw an error
				// Currently there is no a formal list of allowed packages and throw errors
				// would prevent the PZH from working
				console.log('Received unrecognized packet ' + JSON.stringify(msg));
				console.log(msg);
			}
			else if (valError === 'failed') {
				console.log('Validation failed');
			}
			else {
				console.log('Invalid validation response ' + valError);
			}

			//utils.debug(2, 'PZH WSServer: Received packet' + JSON.stringify(msg));

			callback.call(self, parse);
		}
	}	
};

/**
* @description Helper function used by messaging and rpc. Object differentiates between different instance of Pzp. This function is called via mesaging.
* @param {Object} message rpc request or response message
* @param {String} address address to forward message 
* @param {Object} object current pzh or pzp instance
*/
var send = function (message, address, object) {
	"use strict";
	object.sendMessage(message, address);
};

var setMessagingParam = function(self, messageHandler){
	"use strict";
	messageHandler.setGetOwnId(self.sessionId);
	messageHandler.setObjectRef(self);
	messageHandler.setSendMessage(send);
	messageHandler.setSeparator("/");
};

/** Calls messaging function, to adapt to correct object and process received message
* @param data message forwarded to messaging  
*/
exports.sendMessageMessaging = function(self, messageHandler, data) {
	"use strict";
	setMessagingParam(self, messageHandler);
	if(typeof data.to !== 'undefined') {
		messageHandler.onMessageReceived(data, data.to);
	} else {
		messageHandler.onMessageReceived(data);
	}
};

exports.resolveIP = function(serverName, callback) {
	if(net.isIP(serverName) !== 0) {
		console.log('netisip');
		callback(serverName);
	} else {
		dns.resolve(serverName, function(err, addresses) {
			console.log(err);
			if (typeof err !== 'undefined') {
				// try again with lookup
				dns.lookup(serverName, function(err, address, family) {
					console.log(err);
					console.log(address);
					callback(address);
				});				
			} else {
				// resolve succeeded
				console.log(addresses[0]);
				callback(addresses[0]);			
			}
		});
	}
};

exports.getId = getId;
exports.debug = debug;
exports.setMessagingParam = setMessagingParam;

