/**
* @description Session common has functions that are used by both Pzh and Pzp
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
*/
var dns = require('dns');
var net = require('net');
var path = require('path');
var fs = require('fs');
var os = require('os');

var common = exports;

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var webinosDemo  = path.resolve(__dirname, '../../../demo');
var validation   = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_schema.js')); // ADDED BY POLITO
var rpc          = require(path.join(webinosRoot, dependencies.rpc.location));

common.webinosConfigPath = function() {
	var webinosDemo;
	switch(os.type().toLowerCase()){
		case 'windows_nt':
			webinosDemo = path.resolve(process.env.appdata + '/webinos/');
			break;
		case 'linux':
			switch(os.platform().toLowerCase()){
				case 'android':
					webinosDemo = path.resolve(process.env.EXTERNAL_STORAGE + '/.webinos/');
					break;
				case 'linux':
					webinosDemo = path.resolve(process.env.HOME + '/.webinos/');
					break;
			}
			break;
		case 'darwin':
			webinosDemo = path.resolve(process.env.HOME + '/.webinos/');
			break;
	}

	return webinosDemo;
};

common.debug = function(num, msg) {
	"use strict";
	var info = true; // Change this if you want no prints from session manager
	var debug = true;
	if(num === 'ERROR' || num === 1) {
		console.log('ERROR: ' + msg);	
	} else if((num === 'INFO' || num === 2) & info) {
		console.log('INFO: ' + msg);		
	} else if((num === 'DEBUG' || num === 3) && debug) {
		console.log('DEBUG: ' + msg);
	}	
};

/** @desription It removes the connected PZP/Pzh details.
 */
common.removeClient = function(self, conn) {
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

common.processedMsg = function(self, data, dataLen, callback) {
	"use strict";
	var msg = data.toString('utf8');
	if(msg[0] ==='#' && msg[msg.length-dataLen] === '#') {
		msg = msg.split('#');
		/*if(checkSchema(msg[1]) === false) */{
			var parse = JSON.parse(msg[1]);

			// BEGIN OF POLITO MODIFICATIONS
			var valError = validation.checkSchema(parse);
			if(valError === false) { // validation error is false, so validation is ok
				common.debug('DEBUG','[VALIDATION] Received recognized packet ' + JSON.stringify(msg));
			}
			else if (valError === true) {
				// for debug purposes, we only print a message about unrecognized packet
				// in the final version we should throw an error
				// Currently there is no a formal list of allowed packages and throw errors
				// would prevent the PZH from working
				common.debug('INFO','[VALIDATION] Received unrecognized packet ' + JSON.stringify(msg));
				
			}
			else if (valError === 'failed') {
				common.debug('ERROR','[VALIDATION] failed');
			}
			else {
				common.debug('ERROR','[VALIDATION] Invalid response ' + valError);
			}

			callback.call(self, parse);
		}
	}	
};

common.resolveIP = function(serverName, callback) {
	if(net.isIP(serverName) !== 0) {		
		callback(serverName);
	} else {
		dns.resolve(serverName, function(err, addresses) {
			if (err) {
				common.debug('ERROR', err);
				callback(err);
			}
			if (typeof err !== 'undefined') {
				// try again with lookup
				dns.lookup(serverName, function(err, address, family) {
					if (err) {
						common.debug('ERROR', err);
					}
					callback(address);
				});				
			} else {
				// resolve succeeded
				callback(addresses[0]);			
			}
		});
	}
};
