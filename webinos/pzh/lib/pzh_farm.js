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
*******************************************************************************/
/**
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
* @description: Starts PZH farm and handles adding of new PZH
*/

var tls         = require('tls');
var path        = require('path');
var util        = require('util');

var moduleRoot      = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies    = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot     = path.resolve(__dirname, '../' + moduleRoot.root.location);

var cert            = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var utils           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
var log             = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var configuration   = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));
var PzhWebInterface = require(path.join(webinosRoot, dependencies.pzh.location, 'web/pzh_web_interface.js'));

var farm = exports;
farm.pzhs =[];

/**
 * @description: Starts farm.
 * @param {string} url: pzh farm url for e.g. pzh.webinos.org
 * @param {function} callback: true in case successful or else false in case unsuccessful
 */
farm.startFarm = function (url, callback) {
	// The directory structure which farms needs for putting in files 
	configuration.createDirectoryStructure();
	// Configuration setting for pzh, returns set values and connection key
	configuration.setConfiguration('PzhFarm', function (config, conn_key) {
		// Connection parameters for PZH farm TLS server.
		// Note this is the main server, pzh started are SNIContext to this server
		var options = {
			key  : conn_key,
			cert : config.conn.cert,
			ca   : config.master.cert,
			requestCert       : true,
			rejectUnauthorised: false
		};
		// Farm URL
		config.servername = url;
		// Start web interface, this webinterface will adapt depending on user who logins
		startWebInterface (config);
		// Main farm TLS server
		farm.server = tls.createServer (options, function (conn) {
			// if servername existes in conn and farm.pzhs has details about pzh instance, message will be routed to respective PZH authorization function
			if (conn.servername && farm.pzhs[conn.servername]) {
				log('INFO', '[PZHFARM] sending message to ' + conn.servername);
				farm.pzhs[conn.servername].handleConnectionAuthorization(farm.pzhs[conn.servername], conn);
			} else {
				log('ERROR', '[PZHFARM] Server Is Not Registered in Farm');
				conn.socket.end();
				return;
			}
			// In case data is received at farm
			conn.on('data', function(data){
				log('INFO', '[PZHFARM] msg received at farm');
				// forward message to respective PZH handleData function
				if(conn.servername && farm.pzhs[conn.servername]) {
					farm.pzhs[conn.servername].handleData(conn, data);
				}
			});
			// In case of error
			conn.on('end', function(err) {
				log('INFO', '[PZHFARM] ' +conn.servername+' connection end' + err);
			});

			// It calls removeClient to remove PZH from list.
			conn.on('close', function() {
				try {
					log('INFO', '[PZHFARM] ('+conn.servername+') Pzh/Pzp  closed');
					// TODO: fix remove from the list
					//var removed = utils.removeClient(self, conn);
					//self.messageHandler.removeRoute(removed, conn.servername);
					//self.rpcHandler.removeRemoteServiceObjects(removed);
				} catch (err) {
					log('ERROR', '[PZHFARM] ('+conn.servername+') Remove client from connectedPzp/connectedPzh failed' + err);
				}
			});

			conn.on('error', function(err) {
				log('ERROR', '[PZHFARM] ('+conn.servername+') General Error' + err);

			});
		});
		
		farm.server.on('listening', function(){
			log('INFO', '[PZHFARM] Intialized *********** ');
			callback(true);
		});
		
		farm.server.listen(configuration.farmPort);
	});
};

/**
 * @description: this function returns correct pzh id depending on user login details. If details are not present it adds information in config
 * @param {string} url: pzh url
 * @param {object} user: details fetched from openid about user
 */

farm.getPzhInstance = function (url, user) {
	// Check for if user details are stored 
	for (var myKey in farm.pzhs)	{
		if ( myKey === url && (farm.pzhs[myKey].config.userDetails && farm.pzhs[myKey].config.userDetails.displayName === user.displayName)) {
			return farm.pzhs[myKey];
		}		
	}

	// User Details has not been added in PZH
	if(farm.pzhs[url]) {
		farm.pzhs[url].config.userDetails = user;
		configuration.storeConfig(farm.pzhs[url].config);
		return farm.pzhs[url];
	}
	
	// PZH is not started, call addPZH but how to get parameters, redirect back to user to get cert details??
	// Pzh.addPzh();
}

/**
 * @description: Starts web interface for PZH farm
 * @param {config} certificate configuration parameters
 * */
function startWebInterface (config) {
	// WEB INTERFACE INITIALIZATION
	var requestClientCert = false;   // Are we requesting a client certificate?
	var httpOnly          = false;           // Are we running HTTP or HTTPS?
	var webinosDemo       = utils.webinosConfigPath();
	var pzh               = 1;
	
	if (!path.exists(path.join(webinosDemo+'/config/',config.certValues.common.split(':')[0]))) {
		cert.selfSigned( 'PzhWeb', config.certValues, function(status, selfSignErr, ws_key, ws_cert, csr ) {
			if(status === 'certGenerated') {
				fs.readFile(config.master.key_id, function(master_key) {
					cert.signRequest(csr, master_key.toString(),  config.master.cert, pzh, function(result, cert) {
						if(result === 'certSigned') {
							config.webServer.cert = cert;
							fs.writeFileSync(config.webServer.key_id, ws_key);
							configuration.storeConfig(config);
						}
					});
				});
			} else {
				log('ERROR', '[PZH WEB INTERFACE] Certificate generation error')
			}
		});
	}
	PzhWebInterface.startServer(configuration.pzhWebPort, requestClientCert, httpOnly, config, function(status) {
		if (status) {
			log('INFO','[PZH WEB INTERFACE] STARTED ====================');
		} else {
			log('ERROR','[PZH WEB INTERFACE] FAILED TO START *************');
		}
	});
	 
		
}