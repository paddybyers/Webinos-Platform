var pzhConnecting = exports;

var path      = require('path');
var helper    = require(path.resolve(__dirname, 'pzh_helper.js'));
var utils     = require(path.resolve(__dirname, '../../pzp/lib/session_common.js'));	
var messaging = require(path.resolve(__dirname, '../../common/manager/messaging/lib/messagehandler.js'));
var http      = require('http');
var tls  	  = require('tls');
var rpc       = require(path.resolve(__dirname, '../../common/rpc/lib/rpc.js'));			 

pzhConnecting.downloadCertificate = function(pzh, servername, port, callback) {
	var self = pzh;	
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
					fs.writeFile(self.config.pzhOtherCertDir+'/'+parse.payload.message.name, parse.payload.message.cert, function() {
						callback("downloadCertificate");
						pzhConnecting.connectOtherPZH(pzh, servername, '443');
					});
				} catch (err) {
					helper.debug(1, 'PZH ('+self.sessionId+') Error storing other Pzh cert ' + err);
					return;
				}
			});
		});			
	});
	try {
		var msg = {name: self.config.master.cert.name , cert: self.config.master.cert.value};
		var msg = self.prepMsg(null, null,'getMasterCert', msg);
		req.write('#'+JSON.stringify(msg)+'#\n');
		req.end();
	} catch (err) {
		helper.debug(1, 'PZH Error sending master cert to Pzh' + err);
		return;
	}
};

//sessionPzh.connectOtherPZH = function(server, port) {
pzhConnecting.connectOtherPZH = function(pzh, server, port) {
	var self = pzh, options;
	helper.debug(2, 'PZH ('+self.sessionId+') Connect Other PZH');
	try {
		//No CRL support yet, as this is out-of-zone communication.  TBC.
		options = {key: self.config.conn.key.value,
			cert: self.config.conn.cert.value,
			ca: [self.config.master.cert.value]}; 
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
					var msg = messaging.registerSender(self.sessionId, connPzhId);			
					self.sendMessage(msg, connPzhId);
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
