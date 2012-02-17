var pzp_server = exports;

var tls   = require('tls');
var path  = require('path');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var utils        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
var rpc          = require(path.join(webinosRoot, dependencies.rpc.location, 'lib/rpc.js'));

pzp_server.connectOtherPZP = function (pzp, msg) {
	var self, client;
	self = pzp;
	var options = {	key: self.config.conn.key.value,
			cert: self.config.conn.cert.value,
			crl: self.config.master.crl.value,
			ca: self.config.master.cert.value
			};

	client = tls.connect(msg.port, msg.address, options, function () {
		if (client.authorized) {
			utils.debug(2, "PZP (" + self.sessionId + ") Client: Authorized & Connected to PZP: " + msg.address );
			self.connectedPzp[msg.name] = {socket: client};
			var msg1 = self.messageHandler.registerSender(self.sessionId, msg.name);
			self.sendMessage(msg1, msg.name); 
		} else {
			utils.debug(2, "PZP (" + self.sessionId +") Client: Connection failed, first connect with PZH to download certificated");
		}
	});

	client.on('data', function (data) {
		try {
			client.pause();
			utils.processedMsg(self, data, 1, function(data1) {
				for(var i = 1; i < data1.length-1; i += 1) {
					if (data1[i] === '') {
						continue
					}
					var parse = JSON.parse(data1[i]);
					utils.sendMessageMessaging(self, self.messageHandler, parse);
				}

				client.resume();
			});
		} catch (err) {
			utils.debug(1, 'PZP (' + self.sessionId + ') Client: Exception' + err);
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
			
		}
	});

	client.on('end', function () {
		utils.debug(2, "PZP (" + self.sessionId +") Client: Connection terminated");
	});

	client.on('error', function (err) {
		utils.debug(1, "PZP (" + self.sessionId +") Client:  " + err);
	});

	client.on('close', function () {
		utils.debug(2, "PZP (" + self.sessionId + ") Client:  Connection closed by PZP Server");
	});
};

pzp_server.startServer = function (self, callback) {
	var self = self, server;
	// Read server configuration for creating TLS connection
	var config = {	key: self.config.conn.key.value,
			cert: self.config.conn.cert.value,
			ca: self.config.master.cert.value,
			crl: self.config.master.crl.value,
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
			utils.debug(2, "PZP (" + self.sessionId +") Server: Client Authenticated " + sessionId) ;
			
			if(self.connectedPzp[sessionId]) {
				self.connectedPzp[sessionId]= {socket: conn};
			} else {
				self.connectedPzp[sessionId]= {socket: conn, address: conn.socket.peerAddress.address, port: ''};
			}
		} 
			
		conn.on('connection', function () {
			utils.debug(2, "PZP (" + self.sessionId +") Server: Connection established");
		});
	
		conn.on('data', function (data) {
			try{
				utils.processedMsg(self, data, 1, function(data2) {
					for(var i = 1; i < data2.length-1; i += 1) {
						if (data2[i] === '') {
							continue
						}
						var parse = JSON.parse(data2[i]);
						if (parse.type === 'prop' && parse.payload.status === 'pzpDetails') {
							if(self.connectedPzp[parse.from]) {
								self.connectedPzp[parse.from].port = parse.payload.message;
							} else {
								utils.debug(2, "PZP (" + self.sessionId +") Server: Received PZP"+
								"details from entity which is not registered : " + parse.from);
							}
						} else {
							rpc.setSessionId(self.sessionId);
							utils.sendMessageMessaging(self, self.messageHandler, parse);
						}
					}
				});
			} catch(err) {
				utils.debug(1, 'PZP (' + self.sessionId + ' Server: Exception' + err);

			}
		
		});

		conn.on('end', function () {
			utils.debug(2, "PZP Server (" + self.sessionId +") connection end");
		});

		// It calls removeClient to remove PZP from connected_client and connectedPzp.
		conn.on('close', function() {
			utils.debug(2, "PZP Server ("+self.sessionId+")  socket closed");
		});

		conn.on('error', function(err) {
			utils.debug(1, "PZP Server ("+self.sessionId+")"  + err.code);
			
		});
	});

	server.on('error', function (err) {
		if (err.code === 'EADDRINUSE') {
			utils.debug(2,"PZP Server ("+self.sessionId+")  Address in use");
			self.pzpServerPort = parseInt(self.pzpServerPort, 10) + 1;
			server.listen(self.pzpServerPort, self.pzpAddress);
		}
	});

	server.on('listening', function () {
		utils.debug(2, "PZP Server ("+self.sessionId+")  listening as server on port :" + self.pzpServerPort + " address : "+ self.pzpAddress);
		callback.call(self, 'started');
	});				
		
	server.listen(self.pzpServerPort, self.pzpAddress);
};
