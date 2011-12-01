/* It is a client to PZH
 * It runs two servers:
 ** TLS server for allowing other PZP's to connect to it
 ** WebSocket Server to allow websocket connection with the browser
 * It is dependent on session common and messaging
 */
(function () {
	"use strict";

	if (typeof exports !== "undefined") {
		var sessionPzh = require('../../pzh/lib/session_pzh.js'),
		messaging = require("../../common/manager/messaging/lib/messagehandler.js"),
		utils = require('./session_common.js');
	}
	var tls = require('tls'),
	sessionPzp = {},
	fs = require('fs'),
	Pzp = null, 
	tlsId = '';

	Pzp = function () {
		// Stores PZH server details
		this.connectedPzh= [];
		// Stores connected PZP information
		this.connectedPzp = {};
		// List of connected apps i.e session with browser
		this.connectedWebApp = {};
		// sessionWebApp for the connected wev pages
		this.sessionWebApp = 0;		
		//Configuration details of Pzp (certificates, file names)
		this.config = {};
		// Default port to be used by PZP Server
		this.pzpServerPort = 8000;
		// lastMsg received by 
		this.lastMsg = '';
		
		this.tlsId = '';
	};
	
	Pzp.prototype.prepMsg = function(from, to, status, message) {
		var msg = {'type':'prop', 
			'from':from,
			'to':to,
			'payload':{'status':status, 
				'message':message}};
		this.sendMessage(msg, to);
	};
	
	Pzp.prototype.wsServerMsg = function(message) {
		if(typeof this.sessionId !== "undefined" && typeof this.sessionWebAppId !== "undefined")
			this.prepMsg(this.sessionId, this.sessionWebAppId, 'info', message);
	}
	
	/* It is responsible for sending message to correct entity. It checks if message is
	 * for Apps connected via WebSocket server. It forwards message to the correct 
	 * WebSocket client or else message is send to PZH or else to connect PZP server or client
	 * @param message to be sent forward
	 * @param address to forward message
	 */
	Pzp.prototype.sendMessage = function (message, address) {
		var self = this;
		var buf = new Buffer('#'+JSON.stringify(message)+'#');
		try {
		if (self.connectedWebApp[address]) { // it should be for the one of the apps connected.
			utils.debug("PZP (" + self.sessionId +")  Message forwarded to connected app "+address);
			self.connectedWebApp[address].socket.pause();
			self.connectedWebApp[address].sendUTF(JSON.stringify(message));
			process.nextTick(function () {
				self.connectedWebApp[address].socket.resume();
			});
		} else if (self.connectedPzp[address]) {
			utils.debug("PZP (" + self.sessionId +")  Sending message to Client/Server PZP " +address);
			self.connectedPzp[address].socket.socket.pause();
			self.connectedPzp[address].socket.write(buf);
			process.nextTick(function () {
				self.connectedPzp[address].socket.socket.resume();
			});
		} else if(self.connectedPzh[address]){
			// This is for communicating with PZH
			utils.debug("PZP (" + self.sessionId +")  Message sending to PZH "+address);
			self.connectedPzh[address].socket.pause();//socket.socket.
			self.connectedPzh[address].socket.write(buf);
			process.nextTick(function () {
				self.connectedPzh[address].socket.resume();
			});
		} 
		} catch (err) {
			utils.debug('PZP (' + self.sessionId + ': Exception' + err);
			utils.debug(err.code);
			utils.debug(err.stack);
		}

	};	
	
	/* Similar to PZH with only difference that it generates self signed certificate, 
	 * in case if certificates are found it updates the structure. Code to generate
	 * certificate is in session_common.js	 
	 * @param resume: if resume is true connect via old session id
	 * @return options pzp certificate to use for connecting pzh. 
	 */
	Pzp.prototype.checkFiles = function (callback) {
		var self, options;
		self = this;
		fs.readFile(self.config.mastercertname, function (err) {
			if (err) {
				utils.generateSelfSignedCert(self, 'Pzp', function (status) {
					if (status === 'true') {
						options = {
							key: fs.readFileSync(self.config.keyname),
							cert: fs.readFileSync(self.config.certname)
						};
						callback.call(self, options);
					}
				});
			} else {
				if(self.sessionId && tlsId[self.sessionId] !== '') {
					try{
						options = {session: tlsId[self.sessionId]};
						callback.call(self, options);
					} catch(err) {
						utils.debug('PZP (' + self.sessionId + 
						') sessionId file does not exist');
					}
				} else {
					options = {
						key: fs.readFileSync(self.config.keyname),
						cert: fs.readFileSync(self.config.certname),
						ca: fs.readFileSync(self.config.mastercertname)
					};
					callback.call(self, options);
				}
			}
		});
	};
	
	Pzp.prototype.authenticated = function(cn, client, callback) {
		var self = this;
		self.pzhId = cn;
		utils.debug('PZP Connected to PZH & Authenticated');
		self.sessionId = self.pzhId + "/" + self.config.common.split(':')[0];
		self.connectedPzh[self.pzhId] = {socket: client};
		self.pzpAddress = client.socket.address().address;
		tlsId[self.sessionId] = client.getSession();
		var msg = messaging.registerSender(self.sessionId, self.pzhId);
		self.sendMessage(msg, self.pzhId);
		self.startServer(function() {
			self.prepMsg(self.sessionId, self.pzhId, 'pzpDetails', self.pzpServerPort);
			callback.call(self, 'startedPZP');
		});
	}
	
	/* It is responsible for connecting with PZH and handling events.
	 * It does JSON parsing of received message
	 * @param config structure used for connecting with Pzh
	 * @param callback is called after connection is useful or fails to inform startPzp
	 */
	Pzp.prototype.connect = function (config, callback) {
		var self, client, msg = {};
		self = this;
		try {
		client = tls.connect(self.pzhPort, 
			self.pzhName, 
			config, 
			function(conn) {
				utils.debug('PZP Connection to PZH status: ' + client.authorized );
				utils.debug('PZP Reusing session : ' + 	client.isSessionReused());
				
				if(client.authorized){
					var cn = client.getPeerCertificate().subject.CN.split(':')[1];
					self.authenticated(cn, client, callback);
				} else {
					utils.debug('PZP: Not Authenticated ');
					self.pzhId = data2.from;
					self.connectedPzh[self.pzhId] = {socket: client};
					self.prepMsg(self.sessionId, self.pzhId, 'clientCert',
						fs.readFileSync(self.config.certnamecsr).toString()); 
				}
			});
		} catch (err) {
			utils.debug('PZP: Connection Exception' + err);
			utils.debug(err.code);
			utils.debug(err.stack);	
		}
		
		/* It fetches data and forward it to processMsg
		* @param data is teh received data
		*/
		client.on('data', function(data) {
			try {
				client.pause(); // This pauses socket, cannot receive messages
				self.processMsg(data);
				process.nextTick(function () {
					client.resume();// unlocks socket. 
				});			
			} catch (err) {
				utils.debug('PZP: Exception' + err);
				utils.debug(err.code);
				utils.debug(err.stack);			
			}			
		});
		
		client.on('end', function () {
			utils.debug('PZP ('+self.sessionId+') Connection teminated');
		});

		client.on('error', function (err) {
			utils.debug('PZP ('+self.sessionId+') Error connecting server' );
			utils.debug(err.stack);
		});

		client.on('close', function () {
			utils.debug('PZP ('+self.sessionId+') Connection closed by PZH');
		});
		
	};
	
	Pzp.prototype.processMsg = function(data) {
		var self = this;
		var  data2 = {}, myKey, msg ;	
  		
		utils.debug('PZP ('+self.sessionId+') Processing msg'); 
		utils.processedMsg(self, data, 1, function(data2) { // 1 is for #
			utils.debug('PZP ('+self.sessionId+') Received msg'); 
		
			if(data2.type === 'prop' && data2.payload.status === 'signedCert') {
				utils.debug('PZP ('+self.sessionId+') Writing certificates data ');
				fs.writeFile(self.config.certname, data2.payload.message.clientCert, 
				function() {
					fs.writeFile(self.config.mastercertname, 
					data2.payload.message.masterCert,
					function() {
						if(typeof callback !== "undefined") {
							callback.call(self, 'connectPZHAgain');
						}
					});
				});
			} // This is update message about other connected PZP
			else if(data2.type === 'prop' && 
				data2.payload.status === 'pzpUpdate') {
				utils.debug('PZP ('+self.sessionId+') Update PZPs details') ;
				msg = data2.payload.message;
				for (myKey in msg) {
					if(self.sessionId !== myKey) {
						if(!self.connectedPzp[myKey]) {
						self.connectedPzp[msg[myKey].name] = {
							'address': msg[myKey].address, 
							'port': msg[myKey].port};
						self.connectOtherPZP(msg[myKey]);
						self.prepMsg(self.sessionId, 
							sessionPzp.sessionWebAppCurrentId, 
							"info", "Pzp Joined "+msg[myKey].name);
						}
					}
				}	
			}		
			// Forward message to message handler
			else { 
				utils.sendMessageMessaging(self, data2);
			}
		});
	};	

	Pzp.prototype.createWebAppSessionId = function(connection) {
		var self = this, otherPzp = [], mykey, otherPzh = [];
		self.sessionWebAppId = self.sessionId+ '/'+self.sessionWebApp;
		self.sessionWebApp += 1;
		self.connectedWebApp[self.sessionWebAppId] = connection;
		for(mykey in self.connectedPzp)
			otherPzp.push(mykey);
			
		for(mykey in self.connectedPzh)
			otherPzh.push(mykey);
		var payload = {'pzhId':self.pzhId,'connectedPzp': otherPzp,'connectedPzh': otherPzh};
		self.prepMsg(self.sessionId, self.sessionWebAppId, 'registeredBrowser', payload);		
	};
	
	/* starts pzp, creates client, start servers and event listeners
	 * @param server name
	 * @param port: port on which PZH is running
	 */
	sessionPzp.startPzp = function(contents, servername, port, callback) {
		var client = new Pzp();
		client.pzhPort = port;
		client.pzhName = servername;
		
		utils.configure(client, 'Pzp', contents, function(result) {
			utils.debug('PZP (Not Connected) '+result);
			client.checkFiles(function(config) {
				utils.debug('PZP (Not Connected) Client Connecting ');			
				client.connect(config, function(result) {
					if (result === 'connectPZHAgain') {
						utils.debug('PZP ('+client.sessionId+') Client Connecting Again');
						var config = {	key: fs.readFileSync(client.config.keyname),
							cert: fs.readFileSync(client.config.certname),
							ca: fs.readFileSync(client.config.mastercertname)};

						client.connect(config, function(result) {
							if(result === 'startedPZP') {
								callback.call(client, 'startedPZP');
							}
						});
					} else if(result === 'startedPZP') {
						callback.call(client, 'startedPZP');
					}
				});			
			});		
		});
		return client;
	};
	
	sessionPzp.disconnectPzp = function(callback) {
		sessionPzp.connectedPzh[this.sessionId].socket.end();
		callback.call(this, 'Disconnected PZP'); 
	};
	
	/*
	 * Get the session id for this PZP if available.
	 */
	sessionPzp.getSessionId = function() {
		if (typeof sessionPzp.instance !== 'undefined') {
			return sessionPzp.instance.sessionId;
		}
		return undefined;
	};
		
	sessionPzp.startWebSocketServer = function(hostname, serverPort, webServerPort) {
		var self = this,
		http = require('http'),
		url = require('url'),
		path = require('path'),
		WebSocketServer = require('websocket').server;
		var cs = http.createServer(function(request, response) {  
			var uri = url.parse(request.url).pathname;  
			var filename = path.join(process.cwd(), uri);  
			path.exists(filename, function(exists) {  
				if(!exists) {  
					response.writeHead(404, {"Content-Type": "text/plain"});
					response.write("404 Not Found\n");
					response.end();
					return;
				}  
				fs.readFile(filename, "binary", function(err, file) {  
					if(err) {  
						response.writeHead(500, {"Content-Type": "text/plain"});  
						response.write(err + "\n");  
						response.end();  
						return;  
					}
					response.writeHead(200);  
					response.write(file, "binary");  
					response.end();
				});
			});  
		});
	
		cs.on('error', function(err) {
			if (err.code === 'EADDRINUSE') {
				webServerPort = parseInt(webServerPort, 10) + 1;
				cs.listen(webServerPort, hostname); 
			}
		});

		cs.listen(webServerPort, hostname, function(){
			utils.debug("PZP WebServer: Listening on port "+webServerPort);
		});

		var httpserver = http.createServer(function(request, response) {
			utils.debug("PZP WSServer: Received request for " + request.url);
			response.writeHead(404);
			response.end();
		});

		httpserver.on('error', function(err) {
			if (err.code === 'EADDRINUSE') {
				serverPort = parseInt(serverPort, 10) +1; 
				httpserver.listen(serverPort, hostname);				
			}
		});

		httpserver.listen(serverPort, hostname, function() {
			utils.debug("PZP WSServer: Listening on port "+serverPort + 
				" and hostname "+hostname);

		});

		var wsServer = new WebSocketServer({
			httpServer: httpserver,
			autoAcceptConnections: true
		});		
		
		wsServer.on('connect', function(connection) {
			var pzh;
			utils.debug("PZP WSServer: Connection accepted.");
			if(typeof sessionPzp.instance !== "undefined") {
				sessionPzp.instance.createWebAppSessionId(connection);
			}			
			
			connection.on('message', function(message) {
				var self = this;
				var msg = JSON.parse(message.utf8Data);
				utils.debug('PZP WSServer: Received packet ' + JSON.stringify(msg));

				// Each message is forwarded back to Message Handler to forward rpc message
				if(msg.type === 'prop' && msg.payload.status === 'registerBrowser') {
					sessionPzp.instance.createWebAppSessionId(connection);
				} else if(msg.type === 'prop' && msg.payload.status === 'startPzh') {
					pzh = sessionPzh.startPzh(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport, 
						function(result) {
							if(result === 'startedPzh') {
								sessionPzp.instance.wsServerMsg("Pzh " + pzh.sessionId + " started"); 
							}							
						});
				} else if(msg.type === 'prop' && msg.payload.status === 'startPzp') {
					if(sessionPzp.instance !== "null") {
						sessionPzp.instance = sessionPzp.startPzp(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport,
						function(result) {
							sessionPzp.instance.createWebAppSessionId(connection);
							sessionPzp.instance.wsServerMsg("Pzp " + sessionPzp.instance.sessionId+ " started");
						});
					}	
				} else if(msg.type === 'prop' && msg.payload.status === 'disconnectPzp') {
					if( typeof sessionPzp !== "undefined") {
						sessionPzp.instance.connectedPzp[sessionPzp.instance.sessionId].socket.end();
						sessionPzp.instance.wsServerMsg("Pzp "+sessionPzp.instance.sessionId+" closed");
					}
				} else if(msg.type === 'prop' && msg.payload.status === 'downloadCert') {
					if( typeof pzh !== "undefined") {
						pzh.downloadCertificate(msg.payload.servername, msg.payload.serverport, function() {
							sessionPzp.instance.wsServerMsg("Pzh Cert Downloaded");
						});
					}
				}
				 else if(msg.type === 'prop' && msg.payload.status === 'connectPzh') {
	 				if( typeof pzh !== "undefined")
						pzh.connectOtherPZH(msg.payload.servername, msg.payload.serverport, function(result) {
							sessionPzp.instance.wsServerMsg("Pzh " + result + "Connected");
						});
				} else {
					if( typeof sessionPzp.instance !== "undefined" ) {
						utils.sendMessageMessaging(sessionPzp.instance, msg);
					}
				}
			});
			connection.on('close', function(connection) {
					utils.debug("PZP WSServer: Peer " +
						connection.remoteAddress + " disconnected.");
			});	
		});
		
	};
	
	Pzp.prototype.connectOtherPZP = function (msg) {
		var self, client;
		self = this;
		var options = {	key: fs.readFileSync(self.config.keyname),
				cert: fs.readFileSync(self.config.certname),
				ca: fs.readFileSync(self.config.mastercertname)
				};
				
		client = tls.connect(msg.address, msg.port, options, function (conn) {
			if (client.authorized) {
				utils.debug("PZP Client (" + self.sessionId +
					")  Authorized & Connected to PZP: " + msg.address );
				self.connectedPzp[msg.name] = {socket: client};
				var msg1 = messaging.registerSender(self.sessionId, msg.name);
				self.sendMessage(msg1, msg.name); 
			} else {
				utils.debug("PZP (" + self.sessionId +") Client: Connection failed,"+ 
				"first connect with PZH to download certificated");
			}
		});
	
		client.on('data', function (data) {
			try {
				client.pause();
				util.processedMsg(self, data, 1, function(data1) {
					utils.sendMessageMessaging(self, data1);
				  	process.nextTick(function () {
						client.resume();
					});
				}); 			
			} catch (err) {
				utils.debug('PZP (' + self.sessionId + ') Client: Exception' + err);
				utils.debug(err.code);
				utils.debug(err.stack);
				
			}
		});

		client.on('end', function () {
			utils.debug("PZP (" + self.sessionId +") Client: Connection teminated");
		});
	
		client.on('error', function (err) {
			utils.debug("PZP (" + self.sessionId +") Client: Error " + err);
			utils.debug(err.code);
			utils.debug(err.stack);	
		});

		client.on('close', function () {
			utils.debug("PZP (" + self.sessionId + ") Client:  Connection closed by PZP Server");
		});
	};

	Pzp.prototype.startServer = function (callback) {
		var self, server;
		self = this;
		// Read server configuration for creating TLS connection
		var config = {	key: fs.readFileSync(self.config.keyname),
				cert: fs.readFileSync(self.config.certname),
				ca:fs.readFileSync(self.config.mastercertname),
				requestCert:true, 
				rejectUnauthorized:true
				};

		server = tls.createServer(config, function (conn) {
			var cn, parse = null, sessionId;
			/* If connection is authorized:
			* SessionId is generated for PZP. Currently it is PZH's name and 
			* PZP's CommonName and is stored in form of PZH::PZP.
			* registerClient of message manager is called to store PZP as client of PZH
			* Connected_client list is sent to connected PZP. Message sent is with payload 
			* of form {status:'Auth', message:self.connected_client} and type as prop.
			*/
			if (conn.authorized) {
				cn = conn.getPeerCertificate().subject.CN;			
				sessionId = cn.split(':')[0];
				utils.debug("PZP Server (" + self.sessionId +
					" Client Authenticated " + sessionId) ;
				
				self.connectedPzp[sessionId] = {'socket': conn, 
								'name': sessionId, 
								'address': conn.socket.remoteAddress, 
								'port': ''};
			} 
				
			conn.on('connection', function () {
				utils.debug("PZP Server (" + self.sessionId +
					")  Connection established");
			});
		
			conn.on('data', function (data) {
				try{
				utils.debug("PZP (" + self.sessionId +") Received data");
				util.processedMessage(self, data, 1, function(parse) {
				if (parse.type === 'prop' && parse.payload.status === 'pzpDetails') {
					if(self.connectedPzp[parse.from]) {
						self.connectedPzp[parse.from].port = parse.payload.message;
					} else {
						utils.debug("PZP (" + self.sessionId +") Server: Received PZP"+
						"details from entity which is not registered : " + parse.from);
					}
				} else {
					 utils.sendMessageMessaging(self, parse);
				}
				});
				} catch(err) {
				utils.debug('PZP Server (' + self.sessionId + 
					': Exception' + err);
				utils.debug(err.code);
				utils.debug(err.stack);
				}
			
			});

			conn.on('end', function () {
				utils.debug("PZP Server (" + self.sessionId +") connection end");
			});

			// It calls removeClient to remove PZP from connected_client and connectedPzp.
			conn.on('close', function() {
				utils.debug("PZP Server ("+self.sessionId+")  socket closed");
			});

			conn.on('error', function(err) {
				utils.debug("PZP Server ("+self.sessionId+")"  + err.code);
				utils.debug(err.stack);
			});
		});
	
		server.on('error', function (err) {
			if (err.code === 'EADDRINUSE') {
				utils.debug("PZP Server ("+self.sessionId+")  Address in use");
				self.pzpServerPort = parseInt(self.pzpServerPort, 10) + 1;
				server.listen(self.pzpServerPort, self.ipaddr);
			}
		});

		server.on('listening', function () {
			utils.debug("PZP Server ("+self.sessionId+")  listening as server on port :" 
						+ self.pzpServerPort);
			callback.call(self, 'started');
		});				
			
		server.listen(self.pzpServerPort, self.pzpAddress);
	};

	if (typeof exports !== 'undefined') {
 		exports.startPZP = sessionPzp.startPZP;
		exports.startWebSocketServer = sessionPzp.startWebSocketServer;
		exports.send = sessionPzp.send; 
		exports.instance = sessionPzp.instance;
		exports.getSessionId = sessionPzp.getSessionId; 
		exports.disconnectPZP = sessionPzp.disconnectPZP;	
	}

}());
