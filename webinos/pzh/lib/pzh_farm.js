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
var fs          = require('fs');

var moduleRoot      = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies    = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot     = path.resolve(__dirname, '../' + moduleRoot.root.location);

var cert            = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var utils           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
var log             = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var configuration   = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));
var pzhWebInterface = require(path.join(webinosRoot, dependencies.pzh.location, 'web/pzh_webserver.js'));
var pzh             = require(path.join(webinosRoot, dependencies.pzh.location));

var farm = exports;
farm.pzhs =[];
farm.config = {};

function loadPzhs(config) {
	"use strict";
	var key;
	for (key in config.pzhs){
		if(typeof config.pzhs[key] !== "undefined") {
			pzh.addPzh(key, config.pzhs[key].contents,config.pzhs[key].modules, function(res, instance) {
				log('INFO','[PZHFARM] Started PZH ... ' + key);
			});
		}
	}
}

/**
 * @description: Starts farm.
 * @param {string} url: pzh farm url for e.g. pzh.webinos.org
 * @param {function} callback: true in case successful or else false in case unsuccessful
 */
farm.startFarm = function (url, contents, callback) {
	"use strict";
	// The directory structure which farms needs for putting in files 
	configuration.createDirectoryStructure();
	// Configuration setting for pzh, returns set values and connection key
	configuration.setConfiguration(contents,'PzhFarm', function (config, conn_key) {
		// Connection parameters for PZH farm TLS server.
		// Note this is the main server, pzh started are stored as SNIContext to this server
		farm.config = config;
		var options = {
			key  : conn_key,
			cert : farm.config.conn.cert,
			ca   : farm.config.master.cert,
			requestCert       : true,
			rejectUnauthorised: false
		};
		utils.resolveIP(url, function(resolvedAddress) {
			// Farm URL
			farm.config.servername = resolvedAddress;
			// Start web interface, this webinterface will adapt depending on user who logins
			pzhWebInterface.start(url);
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
					log('INFO', '[PZHFARM] Client of ' +conn.servername+' ended connection');
				});

				// It calls removeClient to remove PZH from list.
				conn.on('close', function() {
					try {
						log('INFO', '[PZHFARM] ('+conn.servername+') Pzh/Pzp  closed');
						if(conn.servername && farm.pzhs[conn.servername]) {
							var cl = farm.pzhs[conn.servername];
							var removed = utils.removeClient(cl, conn);
							if (removed !== null && typeof removed !== "undefined"){
								cl.messageHandler.removeRoute(removed, conn.servername);
								cl.rpcHandler.removeRemoteServiceObjects(removed);
							}
						}
					} catch (err) {
						log('ERROR', '[PZHFARM] ('+conn.servername+') Remove client from connectedPzp/connectedPzh failed' + err);
					}
				});

				conn.on('error', function(err) {
					log('ERROR', '[PZHFARM] ('+conn.servername+') General Error' + err);

				});
			});

			farm.server.on('listening', function(){
				log('INFO', '[PZHFARM] Initialized *********** ');
				// Load PZH's that we already have registered ...
				loadPzhs(farm.config);
				callback(true);
			});

			farm.server.listen(configuration.farmPort, resolvedAddress);
		});
	});
};

/**
 * @description: this function returns correct pzh id depending on user login details. If details are not present it adds information in config
 * @param {string} url: pzh url
 * @param {object} user: details fetched from openid about user
 */
farm.getOrCreatePzhInstance = function (host, user, callback) {
	"use strict";
	var name;
	
	if (typeof user.name === 'undefined' ) {
		name = user.email;
	} else {
		name = user.name;
	}
	// Check for if user already existed and is stored	
	var myKey = host+'/'+name;

	if ( farm.pzhs[myKey] && farm.pzhs[myKey].config.details.name === user.name ) {
		log('INFO', '[PZHFARM] User already registered');
		callback(myKey, farm.pzhs[myKey]);		
	} else if(farm.pzhs[myKey]) { // Cannot think of this case, but still might be useful
		log('INFO', '[PZHFARM] User first time login');
		farm.pzhs[myKey].config.details = user;
		configuration.storeConfig(farm.pzhs[myKey].config, function() {
			callback(myKey, farm.pzhs[myKey]);
		});
	} else {
		log('INFO', '[PZHFARM] Adding new PZH');
		var contents="country="+user.country+
			"\nstate=\'\'\ncity=\'\'\norganization=\'\'\norganizationUnit=\'\'"+
			"\ncommon="+name+"_pzh"+"\nemail="+user.email+"\ndays=3600";
		var pzhModules = configuration.pzhDefaultServices;
		pzh.addPzh(myKey, contents, pzhModules, function(){
			farm.pzhs[myKey].config.details = user;
			configuration.storeConfig(farm.pzhs[myKey].config, function() {
				callback(myKey, farm.pzhs[myKey]);
			});
		});
	}
};
