var pzp_server = exports;

var tls   = require('tls');
var path  = require('path');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var utils        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
var cert         = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));        
var logs         = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var rpc          = require(path.join(webinosRoot, dependencies.rpc.location, 'lib/rpc.js'));

pzp_server.connectOtherPZP = function (pzh, msg) {
	var self = pzh, client;
	cert.fetchKey(self.config.conn.key_id, function(key) {		
		var options = {
				key:  key,
				cert: self.config.conn.cert,
				crl:  self.config.master.crl,
				ca:   self.config.master.cert
				};

		client = tls.connect(msg.port, msg.address, options, function () {
			if (client.authorized) {
				logs('INFO', "[PZP - " + self.sessionId + "] Client: Authorized & Connected to PZP: " + msg.address );
				self.connectedPzp[msg.name] = {socket: client};
				
				var msg1 = self.messageHandler.registerSender(self.sessionId, msg.name);
				self.sendMessage(msg1, msg.name); 
			} else {
				logs('INFO', "[PZP - " + self.sessionId + "]  Client: Connection failed, first connect with PZH to download certificated");
			}
		});

		client.on('data', function (data) {
			try {
				client.pause();
				utils.processedMsg(self, data, 1, function(data1) {
					self.messageHandler.onMessageReceived(data1, data1.to);
					process.nextTick(function () {
						client.resume();
					});
				});
			} catch (err) {
				logs('ERROR', "[PZP - " + self.sessionId + "]  Client: Exception" + err);
			}
		});

		client.on('end', function () {
			logs('INFO', "[PZP - " + self.sessionId + "]  Client: Connection terminated");
		});

		client.on('error', function (err) {
			logs('ERROR', "[PZP - " + self.sessionId + "]  Client:  " + err);			
		});

		client.on('close', function () {
			logs('INFO', "[PZP - " + self.sessionId + "] Client:  Connection closed by PZP Server");
		});
	});
};

pzp_server.startServer = function (self, callback) {
	var server;
	cert.fetchKey(self.config.conn.key_id, function(key) {
		// Read server configuration for creating TLS connection
		var config = {	
				key: key,
				cert: self.config.conn.cert,
				ca: self.config.master.cert,
				crl: self.config.master.crl,
				requestCert: true, 
				rejectUnauthorized: true
				};

		server = tls.createServer(config, function (conn) {
			var cn, sessionId;
			/* If connection is authorized:
			* SessionId is generated for PZP. Currently it is PZH's name and 
			* PZP's CommonName and is stored in form of PZH::PZP.
			* registerClient of message manager is called to store PZP as client of PZH
			* Connected_client list is sent to connected PZP. Message sent is with payload 
			* of form {status:'Auth', message:self.connected_client} and type as prop.
			*/
			if (conn.authorized) {
				cn = conn.getPeerCertificate().subject.CN;			
				sessionId = self.pzhId + '/' +cn.split(':')[1];
				logs('INFO', "[PZP Server - " + self.sessionId + "]  Server: Client Authenticated " + sessionId) ;
				
				if(self.connectedPzp[sessionId]) {
					self.connectedPzp[sessionId]= {socket: conn};
				} else {
					self.connectedPzp[sessionId]= {socket: conn, address: conn.socket.peerAddress.address, port: ''};
				}
			} 
				
			conn.on('connection', function () {
				logs('INFO', "[PZP Server - " + self.sessionId + "]  Server: Connection established");
			});
		
			conn.on('data', function (data) {
				try{
				utils.processedMsg(self, data, 1, function(parse) {
					if (parse.type === 'prop' && parse.payload.status === 'pzpDetails') {
						if(self.connectedPzp[parse.from]) {
							self.connectedPzp[parse.from].port = parse.payload.message;
						} else {
							logs('INFO', "[PZP Server - " + self.sessionId + "]  Server: Received PZP"+
							"details from entity which is not registered : " + parse.from);
						}
					} else {
 						rpc.setSessionId(self.sessionId);
						self.messageHandler.onMessageReceived(parse, parse.to);
					}
				});
				} catch(err) {
					logs('ERROR', "[PZP Server - " + self.sessionId + "]  Server: Exception" + err);
				}
			
			});

			conn.on('end', function () {
				logs('INFO', "[PZP Server - " + self.sessionId + "] connection end");
			});

			// It calls removeClient to remove PZP from connected_client and connectedPzp.
			conn.on('close', function() {
				logs('ERROR', "[PZP Server - " + self.sessionId + "] socket closed");
			});

			conn.on('error', function(err) {
				logs('ERROR', "[PZP Server - " + self.sessionId + "] " + err);
			});
		});
	
		server.on('error', function (err) {
			if (err.code === 'EADDRINUSE') {
				logs('INFO', "[PZP Server - " + self.sessionId + "]  Address in use");
				self.pzpServerPort = parseInt(self.pzpServerPort, 10) + 1;
				server.listen(self.pzpServerPort, self.pzpAddress);
			}
		});

		server.on('listening', function () {
			logs('INFO', "[PZP Server - " + self.sessionId + "] listening as server on port :" + self.pzpServerPort + " address : "+ self.pzpAddress);
			callback.call(self, 'started');
		});				
			
		server.listen(self.pzpServerPort, self.pzpAddress);
	});
};
