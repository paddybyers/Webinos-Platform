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
* Copyright 2011 Samsung Electronics Research Institute
* Copyright 2011 Alexander Futasz, Fraunhofer FOKUS
*******************************************************************************/

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

// global exception handler, which catches all unhandled exceptions,
// prints a trace and exits. the trace is better than the default.
/*process.addListener("uncaughtException", function (err) {
    console.log("Uncaught exception: " + err);
    console.trace();
    process.exit();
});*/

var writeError;
var msgSave;
common.writeStream = function(stream){
	writeError = stream;
	msgSave = [];
}

common.debug = function(num, msg) {
	"use strict";
	var info = true; // Change this if you want no prints from session manager
	var debug = true;
	
	if(num === 'ERROR' || num === 1) {
		console.log('ERROR: ' + msg);
		if (typeof writeError !== "undefined") {
			msgSave[date] = msg;
			writeError.write(JSON.stringify(msgSave, null, ''));
		}
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

	for (var id in self.connectedPzp){
		if (self.connectedPzp[id].socket === conn) {
			delete self.connectedPzp[i];
			return id;
		}
	}
};

var message = '';
common.processedMsg = function(self, data, callback) {
	"use strict";
	var msg = data.toString('utf8');
	var dataLen = 1;
	// This part of the code is executed when message comes in chunks 
	// First part of the message coming in
	if (msg[0] === '#' && msg[msg.length-dataLen] !== '#') {
		message = msg;
		return;
	}
	// This is the middle of the message
	if (msg[0] !== '#' && msg[msg.length-dataLen] !== '#') {
		message += msg;
		return;
	}
	// This is the last part of the message
	if (msg[0] !== '#' && msg[msg.length-dataLen] === '#') {
		message += msg;
		msg = message;

		message = '';
	}
	
	if(msg[0] ==='#' && msg[msg.length-dataLen] === '#') {
		msg = msg.split('#');
		
		var parse = JSON.parse(msg[1]);
		// TODO POLITO: It is multiple messages in a msg string, check for all of them
		// BEGIN OF POLITO MODIFICATIONS
		for (var i = 1 ; i < parse.length-1; i += 1) {
			var valError = validation.checkSchema(parse[i]);
			if(valError === false) { // validation error is false, so validation is ok
				common.debug('DEBUG','[VALIDATION] Received recognized packet ' + JSON.stringify(parse[i]));
			} else if (valError === true) {
				// for debug purposes, we only print a message about unrecognized packet
				// in the final version we should throw an error
				// Currently there is no a formal list of allowed packages and throw errors
				// would prevent the PZH from working
				common.debug('INFO','[VALIDATION] Received unrecognized packet ' + JSON.stringify(parse[i]));
			} else if (valError === 'failed') {
				common.debug('ERROR','[VALIDATION] failed');
			} else {
				common.debug('ERROR','[VALIDATION] Invalid response ' + valError);
			}
		}
		callback.call(self, msg);
	}

};

common.resolveIP = function(serverName, callback) {
	if(net.isIP(serverName) !== 0) {		
		callback(serverName);
	} else {
		dns.resolve(serverName, function(err, addresses) {
			if (typeof err !== 'undefined') {
				// try again with lookup
				dns.lookup(serverName, function(err, address, family) {
					if (err) {
						callback("undefined");
						return;
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
