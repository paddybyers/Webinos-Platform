var pzhConnecting = exports;

pzhConnecting.downloadCertificate = function(servername, port) {
	var self = this;
	var http = require('http');
	var agent = new http.Agent({maxSockets: 1});
	var headers = {'connection': 'keep-alive'};
	if (servername === '' && port === '') {
		utils.debug(2, ' Pzh download certificate missing servername and port ');
		return;
	}
	
	var options = {
		headers: headers,		
		port: port,
		host: servername,
		agent: agent,
		method: 'POST'
	};

	var req = http.request(options, function(res) {		
		res.on('data', function(data) {
			utils.processedMsg(data, 2, function(parse) {	
				try {
					fs.writeFile(pzhOtherCertDir+'/'+'pzh_cert.pem', parse.payload.message, function() {
						pzhConnecting.connectOtherPZH(servername, '443');
					});
				} catch (err) {
					utils.debug(1, 'PZH ('+pzh.sessionId+') Error storing other Pzh cert');
					utils.debug(1, err.code);
					utils.debug(1, err.stack);
					return;
				}
			});
		});			
	});
	try {
		var msg = self.prepMsg(null,null,'getMasterCert', pzh.config.master.cert.value);
		req.write('#'+JSON.stringify(msg)+'#\n');
		req.end();
	} catch (err) {
		utils.debug(1, 'PZH ('+pzh.sessionId+') Error sending master cert to Pzh');
		utils.debug(1, err.code);
		utils.debug(1, err.stack);
		return;
	}
};

//sessionPzh.connectOtherPZH = function(server, port) {
pzhConnecting.connectOtherPZH = function(server, port) {
	var self = this, options;
	utils.debug(2, 'PZH ('+self.sessionId+') Connect Other PZH');
	try {
		//No CRL support yet, as this is out-of-zone communication.  TBC.
		options = {key: self.config.conn.key.value,
			cert: self.config.conn.cert.value,
			ca: [self.config.master.cert.value]}; 
	} catch (err) {
		utils.debug(1, 'PZH ('+pzh.sessionId+') Options setting failed while connecting other Pzh');
		utils.debug(1, err.code);
		utils.debug(1, err.stack);
		return;
	}
		
	var connPzh = tls.connect(port, server, options, function() {
		utils.debug(2, 'PZH ('+self.sessionId+') Connection Status : '+connPzh.authorized);
		if(connPzh.authorized) {
			var connPzhId;
			utils.debug(2, 'PZH ('+self.sessionId+') Connected ');
			try {
				connPzhId = connPzh.getPeerCertificate().subject.CN.split(':')[1];
			} catch (err) {
				utils.debug(1, 'PZH ('+pzh.sessionId+') Error reading common name of peer certificate');
				utils.debug(1, err.code);
				utils.debug(1, err.stack);
				return;
			}
			try {
				if(self.connectedPzh.hasOwnProperty(connPzhId)) {
					self.connectedPzh[connPzhId] = {socket : connPzh};
					var msg = messaging.registerSender(self.sessionId, connPzhId);			
					self.sendMessage(msg, connPzhId);
				}
			} catch (err1) {
				utils.debug(1, 'PZH ('+pzh.sessionId+') Error storing pzh in the list');
				utils.debug(1, err1.code);
				utils.debug(1, err1.stack);
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
					utils.debug(1, 'PZH ('+pzh.sessionId+') Error sending message to messaging');
					utils.debug(1, err.code);
					utils.debug(1, err.stack);
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
