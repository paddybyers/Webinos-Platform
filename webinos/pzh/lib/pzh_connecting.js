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
var helper    = require(path.resolve(__dirname, 'pzh_helper.js'));
var utils     = require(path.resolve(__dirname, '../../pzp/lib/session_common.js'));	
var http      = require('http');
var tls       = require('tls');
var rpc       = require(path.resolve(__dirname, '../../common/rpc/lib/rpc.js'));			 

pzhConnecting.connectOtherPZH = function(pzh, server, port) {
	var self = pzh, options;
	helper.debug(2, 'PZH ('+self.sessionId+') Connect Other PZH');
	try {
		var ca = [self.config.master.cert.value];
		
		//No CRL support yet, as this is out-of-zone communication.  TBC.
		options = {key: self.config.conn.key.value,
				cert: self.config.conn.cert.value,
				ca: ca};
	} catch (err) {
		helper.debug(1, 'PZH ('+self.sessionId+') Options setting failed while connecting other Pzh ' + err);
		return;
	}
		
	var connPzh = tls.connect(port, server, options, function() {
		helper.debug(2, 'PZH ('+self.sessionId+') Connection Status : '+connPzh.authorized);
		if(connPzh.authorized) {
			var connPzhId;
			helper.debug(2, 'PZH ('+self.sessionId+') Connected ');
			try {
				connPzhId = connPzh.getPeerCertificate().subject.CN.split(':')[1];
			} catch (err) {
				helper.debug(1, 'PZH ('+self.sessionId+') Error reading common name of peer certificate ' + err);
				return;
			}
			try {
				if(self.connectedPzh.hasOwnProperty(connPzhId)) {
					self.connectedPzh[connPzhId] = {socket : connPzh};
					self.sendRegisterMessage();
				}
			} catch (err1) {
				utils.debug(1, 'PZH ('+selfsessionId+') Error storing pzh in the list ' + err);
				return;
			}
		} else {
			utils.debug(2, 'PZH ('+self.sessionId+') Not connected');
		}
	
		connPzh.on('data', function(data) {
			utils.processedMsg(data, 1, function(parse){
				try {
					rpc.SetSessionId(self.sessionId);
					utils.sendMessageMessaging(parse);				
				} catch (err) {
					utils.debug(1, 'PZH ('+self.sessionId+') Error sending message to messaging ' + err);
				}
			});				
			
		});

		connPzh.on('error', function(err) {
			utils.debug(2, 'PZH ('+self.sessionId+') Error in connect Pzh' + err.stack );
		});

		connPzh.on('close', function() {
			utils.debug(2, 'Peer Pzh closed');
		});

		connPzh.on('end', function() {
			utils.debug(2, 'Peer Pzh End');
		});

	});
};
