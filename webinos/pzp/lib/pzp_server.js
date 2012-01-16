var pzp_server = exports;
var tls = require('tls');
pzp_server.connectOtherPZP = function (msg) {
	var self, client;
	self = this;
	var options = {	key: self.config.conn.key.value,
			cert: self.config.conn.cert.value,
			crl: self.config.master.crl.value,
			ca: self.config.master.cert.value
			};

	client = tls.connect(msg.port, msg.address, options, function () {
		if (client.authorized) {
			utils.debug(2, "PZP (" + self.sessionId + ") Client: Authorized & Connected to PZP: " + msg.address );
			self.connectedPzp[msg.name] = {socket: client};
			var msg1 = messaging.registerSender(self.sessionId, msg.name);
			self.sendMessage(msg1, msg.name); 
		} else {
			utils.debug(2, "PZP (" + self.sessionId +") Client: Connection failed, first connect with PZH to download certificated");
		}
	});

	client.on('data', function (data) {
		try {
			client.pause();
			utils.processedMsg(self, data, 1, function(data1) {
				utils.sendMessageMessaging(self, data1);
				process.nextTick(function () {
					client.resume();
				});
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
		utils.debug(1, err.code);
		utils.debug(1, err.stack);	
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
			console.log(conn.socket);
			console.log(conn.socket.peerAddress);
				self.connectedPzp[sessionId]= {socket: conn, address: conn.socket.peerAddress.address, port: ''};
			}
		} 
			
		conn.on('connection', function () {
			utils.debug(2, "PZP (" + self.sessionId +") Server: Connection established");
		});
	
		conn.on('data', function (data) {
			try{
			utils.processedMsg(self, data, 1, function(parse) {
				if (parse.type === 'prop' && parse.payload.status === 'pzpDetails') {
					if(self.connectedPzp[parse.from]) {
						self.connectedPzp[parse.from].port = parse.payload.message;
					} else {
						utils.debug(2, "PZP (" + self.sessionId +") Server: Received PZP"+
						"details from entity which is not registered : " + parse.from);
					}
				} else {
					rpc.SetSessionId(self.sessionId);
					utils.sendMessageMessaging(self, parse);
				}
			});
			} catch(err) {
				utils.debug(1, 'PZP (' + self.sessionId + ' Server: Exception' + err);
				utils.debug(1, err.code);
				utils.debug(1, err.stack);
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
			utils.debug(1, err.stack);
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
