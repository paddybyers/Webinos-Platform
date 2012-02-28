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
var log          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var revoker      = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_revoke.js'));	
var session      = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_sessionHandling.js'));
var configuration= require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));
var farm         = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_farm.js'));

pzhapis.addPzpQR = function (pzh, callback) {
	"use strict";
	qrcode.addPzpQRAgain(pzh, callback);
}

pzhapis.listZoneDevices = function(pzh, callback) {
	"use strict";
	var result = {pzps: [], pzhs: []};

	for (var myKey in pzh.config.signedCert){
		result.pzps.push(getPzpInfoSync(pzh, myKey));
	}

	for (var myKey in pzh.config.otherCert){
		result.pzhs.push(getPzhInfoSync(pzh, myKey));
	}

	var err3 = { };
	callback(err3, result);
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
	if (pzhId === pzh.config.certValues.common.split(':')[0]) {
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
	pzhapis.restartPzh(pzh, callback);
}

// This is sending side action on PZH end
pzhapis.addPzhCertificate = function(pzh, to, callback) {
	"use strict";
	
	var id = pzh.config.servername.split('/')[0];
	var id_to = to.split('/')[0];

	// There are two scenarios:
	// 1. Inside same PZH Farm, it is a mere copy. 
	if (id === id_to) {
		for (var pzh_id in farm.pzhs) {
			if( pzh_id === to) {
				// Store the information in other_cert
				pzh.config.otherCert[pzh_id] = farm.pzhs[pzh_id].config.master.cert;
				farm.pzhs[pzh_id].config.otherCert[pzh.config.servername] = pzh.config.master.cert;
				// Add in particular context of each PZH options
				pzh.options.ca.push(pzh.config.otherCert[pzh_id]);
				farm.pzhs[pzh_id].options.ca.push(pzh.config.master.cert);
				
				farm.server.addContext(pzh.config.servername, pzh.options);
				farm.server.addContext(to, farm.pzhs[pzh_id].options);
				// pzh.serverContext.pair.credentials.context.addCACert(pzh.config.other_cert[pzh_id]);
				
				// Store configuration
				configuration.storeConfig(pzh.config);
				configuration.storeConfig(farm.pzhs[pzh_id].config);
				callback(true);
				return;

			}
		}
		callback(false);
	} 
	// TODO:2. Outside farm, this will involve https.request going out.
	else {
		var payload = pzh.prepMsg(pzh.sessionId, to, 'receiveMasterCert', pzh.config.master.cert);
		callback(true);
	}
	
}

pzhapis.crashLog = function(pzh, callback) {
	"use strict";	
	try {
		// TODO: Create log directory and store information in it about PZH
		var logFile = webinosDemo + '/'+pzh.sessionId + '_crash.txt';
		var clog = fs.readFileSync(logFile, 'utf8');
		callback(null,clog);
	} catch (err) {
		log('ERROR', 'PZH ('+pzh.sessionId+') Error creating crashlog ' + err);
		callback(err);
	}
}
	
// TODO: THIS IS NOT WORKING FIX IT
pzhapis.restartPzh = function(instance, callback) {
	try {
		log('INFO', util.inspect(instance));
		if ((typeof instance.conn.end) === 'undefined' ) {
			callback.call(instance, "Failed - no open connections to close");
		} else {
			instance.
			instance.socket.close();
			session.addPzh(instance.config.servername, instance.contents, instance.modules,  function(result){
				callback.call(instance, result);
			});
		}
	} catch(err) {
		log('ERROR', 'Pzh restart failed ' + err);
		callback.call(instance, err);
	}
}
