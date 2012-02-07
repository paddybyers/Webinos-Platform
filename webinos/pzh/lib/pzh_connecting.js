var pzhConnecting = exports;

var path      = require('path');
var http      = require('http');
var tls       = require('tls');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);

var utils        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'))
var log          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;

pzhConnecting.downloadCertificate = function(pzh, servername, port, callback) {
	var self = pzh;	
	var agent = new http.Agent({maxSockets: 1});
	var headers = {'connection': 'keep-alive'};
	if (servername === '' && port === '') {
		log('INFO', ' Pzh download certificate missing servername and port ');
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
					log('ERROR', 'PZH ('+self.sessionId+') Error storing other Pzh cert ' + err);
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
		log('ERROR', 'PZH Error sending master cert to Pzh' + err);
		return;
	}
};

//sessionPzh.connectOtherPZH = function(server, port) {
pzhConnecting.connectOtherPZH = function(pzh, server, port) {
	var self = pzh, options;
	log('INFO', 'PZH ('+self.sessionId+') Connect Other PZH');
	try {
		//No CRL support yet, as this is out-of-zone communication.  TBC.
		options = {key: self.config.conn.key.value,
			cert: self.config.conn.cert.value,
			ca: [self.config.master.cert.value]}; 
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
				};
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
