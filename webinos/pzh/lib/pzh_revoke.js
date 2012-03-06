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


var revoker = exports;

var fs      = require('fs');
var path    = require('path');
var crypto  = require('crypto');
var util    = require('util');

var moduleRoot    = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies  = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot   = path.resolve(__dirname, '../' + moduleRoot.root.location);

var cert          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var utils         = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
var log           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debugPzh;
var configuration = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));

function revoke(pzh, pzpCert, callback) {
	"use strict";
	configuration.fetchKey(pzh.config.master.key_id, function(master_key) { 
		cert.revokeClientCert(master_key, pzh.config.master.crl, pzpCert, function(result, crl) {
			if (result === "certRevoked") {
				/* This should work, if this works then we do not have to restart PZH
				try {
					pzh.conn.pair.credentials.context.addCRL(crl);
				} catch (err) {
					console.log(err);
				}
				*/
				pzh.config.master.crl = crl;
				configuration.storeConfig(pzh.config);
				//TODO : trigger the PZH to reconnect all clients
				//TODO : trigger a synchronisation with PZPs.
				callback(true);
			} else {
				log(pzh.sessionId, "ERROR", "[PZH - "+pzh.sessionId+"] Failed to revoke client certificate [" + pzpCert + "]");
				callback(false);
			}
		});
	});
}

function removeRevokedCert(pzh, pzpid, config, callback) {
	"use strict";
	try {
		config.revokedCert[pzpid] = config.signedCert[pzpid];
		delete config.signedCert[pzpid] ;
		configuration.storeConfig(config);
		callback(true);
	} catch (err) {
		log(pzh.sessionId, "INFO", "[PZH - "+ pzh.sessionId+"] Unable to rename certificate " + err);
		callback(false);
	}
}
	
revoker.revokePzp = function (pzpid, pzh, callback ) {
	"use strict";
	var pzpcert = pzh.config.signedCert[pzpid];
	if (typeof pzpcert !== "undefined" ) {
		revoke(pzh, pzpcert, function(result) {
			if (result) {
				log(pzh.sessionId, "INFO", "[PZH - "+ pzh.sessionId+"]Revocation success! " + pzpid + " should not be able to connect anymore ");

				removeRevokedCert(pzh, pzpid, pzh.config, function(status2) {
					if (!status2) {
						log(pzh.sessionId, "INFO", "[PZH - "+ pzh.sessionId+"] Could not rename certificate");
					}
					callback();
					return;
				});
			} else {
				log(pzh.sessionId, "INFO", "[PZH - "+ pzh.sessionId+"] Revocation failed! ");
				callback("failed to update CRL");
			}
		});
	}
};
