var pzhConnecting = exports;

var path      = require('path');
var http      = require('http');
var tls       = require('tls');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);

var utils        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
var certificate  = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var log          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var config       = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));


// this is for connecting when PZH is not in same farm
pzhConnecting.connectOtherPZH = function(pzh, server, callback) {
	var self = pzh, options;
	var serverName;
	if (server.split('/')) {
		serverName = server.split('/')[0];
	} else {
		serverName = server;		
	}
	
	log('INFO', '[PZH -'+self.sessionId+'] Connect Other PZH');
	
	certificate.fetchKey(self.config.conn.key_id, function(key_id) {
		try {
			var caList = [];
			caList.push(self.config.master.cert);
			for (var pzh_id in self.config.otherCert) {
				caList.push(self.config.otherCert[pzh_id]);
			}
			//No CRL support yet, as this is out-of-zone communication.  TBC.
			options = {
				key:  key_id ,
				cert: self.config.conn.cert,
				ca:   caList,
				servername: server};
			console.log(options);
		} catch (err) {
			log('ERROR', '[PZH -'+self.sessionId+'] Options setting failed while connecting other Pzh ' + err);
			return;
		}
		// It is similar to PZP connecting to PZH but instead it is PZH to PZH connection	
		var connPzh = tls.connect(config.pzhPort, serverName, options, function() {
			log('INFO', '[PZH -'+self.sessionId+'] Connection Status : '+connPzh.authorized);
			if(connPzh.authorized) {
				var connPzhId;
				log('INFO', '[PZH -'+self.sessionId+'] Connected ');
				try {
					connPzhId = connPzh.getPeerCertificate().subject.CN.split(':')[1];
				} catch (err) {
					log('ERROR', '[PZH -'+self.sessionId+'] Error reading common name of peer certificate ' + err);
					return;
				}
				try {
					if(self.connectedPzh.hasOwnProperty(connPzhId)) {
						self.connectedPzh[connPzhId] = {socket : connPzh};
						self.messageHandler.setGetOwnId(self.sessionId);
						self.messageHandler.setObjectRef(self);
						self.messageHandler.setSendMessage(send);
						self.messageHandler.setSeparator("/");
						var msg = self.messageHandler.registerSender(self.sessionId, connPzhId);
						self.sendMessage(msg, connPzhId);
					}				
				} catch (err1) {
					log('ERROR', 'PZH ('+selfsessionId+') Error storing pzh in the list ' + err);
					return;
				}
			} else {
				log('INFO', '[PZH -'+self.sessionId+'] Not connected');
			}
		
			connPzh.on('data', function(data) {
				utils.processedMsg(data, 1, function(parse){
					try {
						rpc.SetSessionId(self.sessionId);
						self.messageHandler.onMessageReceived(parse);				
					} catch (err) {
						log('ERROR', '[PZH -'+self.sessionId+'] Error sending message to messaging ' + err);
					}
				});				
				
			});

			connPzh.on('error', function(err) {
				log('ERROR', '[PZH -'+self.sessionId+'] Error in connect Pzh' + err.stack );
			});

			connPzh.on('close', function() {
				log('INFO', 'Peer Pzh closed');
			});

			connPzh.on('end', function() {
				log('INFO', 'Peer Pzh End');
			});

		});
	});
};
