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

/*
 * Handles connection with other PZH
 */

var pzhConnecting = exports;

var path      = require('path');
var http      = require('http');
var tls       = require('tls');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);

var utils        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'))
var log          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var config       = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));

var rpc          = require(path.resolve(__dirname, dependencies.rpc.location));

pzhConnecting.connectOtherPZH = function(pzh, server, port) {
	var self = pzh, options;
	log('INFO', 'PZH ('+self.sessionId+') Connect Other PZH');
	try {
		var ca = [self.config.master.cert.value];
		
		//No CRL support yet, as this is out-of-zone communication.  TBC.
		options = {key: self.config.conn.key,
			cert: self.config.conn.cert,
			ca: [self.config.master.cert]};
	} catch (err) {
		log('ERROR', 'PZH ('+self.sessionId+') Options setting failed while connecting other Pzh ' + err);
		return;
	}
		
	var connPzh = tls.connect(port, server, options, function() {
		log('INFO', 'PZH ('+self.sessionId+') Connection Status : '+connPzh.authorized);
		if(connPzh.authorized) {
			var connPzhId;
			log('INFO', 'PZH ('+self.sessionId+') Connected ');
			try {
				connPzhId = connPzh.getPeerCertificate().subject.CN.split(':')[1];
			} catch (err) {
				log('ERROR', 'PZH ('+self.sessionId+') Error reading common name of peer certificate ' + err);
				return;
			}
			try {
				if(self.connectedPzh.hasOwnProperty(connPzhId)) {
					self.connectedPzh[connPzhId] = {socket : connPzh};
					var msg = self.messageHandler.registerSender(self.sessionId, connPzhId);
					self.sendMessage(msg, connPzhId);
				}				
			} catch (err1) {
				log('ERROR', 'PZH ('+selfsessionId+') Error storing pzh in the list ' + err);
				return;
			}
		} else {
			log('INFO', 'PZH ('+self.sessionId+') Not connected');
		}
	
		connPzh.on('data', function(data) {
			utils.processedMsg(data, 1, function(parse){
				try {
					rpc.SetSessionId(self.sessionId);
					utils.sendMessageMessaging(parse);				
				} catch (err) {
					log('ERROR', 'PZH ('+self.sessionId+') Error sending message to messaging ' + err);
				}
			});				
			
		});

		connPzh.on('error', function(err) {
			log('INFO', 'PZH ('+self.sessionId+') Error in connect Pzh' + err.stack );
		});

		connPzh.on('close', function() {
			log('INFO', 'Peer Pzh closed');
		});

		connPzh.on('end', function() {
			log('INFO', 'Peer Pzh End');
		});

	});
};
