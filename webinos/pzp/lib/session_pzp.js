/**
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
* @description It starts Pzp and handle communication with web socket server. Websocket server allows starting Pzh and Pzp via a web browser
*/
(function () {
	"use strict";
	if (typeof webinos === 'undefined') {
		var webinos = {};
	}

	if(typeof webinos.session === 'undefined') {
		webinos.session = {}; 
	}

	var path = require('path');
	var moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
	var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
	var webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location);

	if (typeof exports !== "undefined") {
		var sessionPzh = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/session_pzh.js')),
		var rpc = require(path.join(webinosRoot, dependencies.rpc.location, 'lib/rpc.js')),
		
		var rpcHandler = new RPCHandler();
		rpc.loadModules(rpcHandler);

		var sessionPzh = require(path.join(webinosRoot, dependencies.manager.messaging.location, 'lib/messagehandler.js')),
		
		messaging.setRPCHandler(rpcHandler);
		
		var utils = require('./session_common.js'),
		sessionPzp = {};
	}
	
	var tls = require('tls'),
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
		this.pzpServerPort = 8040;
		// Used for session reuse
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
		if(typeof this.sessionId !== "undefined" && typeof this.sessionWebAppId !== "undefined") {
			this.prepMsg(this.sessionId, this.sessionWebAppId, 'info', message);
		}
	};
	
	/* It is responsible for sending message to correct entity. It checks if message is
	 * for Apps connected via WebSocket server. It forwards message to the correct 
	 * WebSocket client or else message is send to PZH or else to connect PZP server or client
	 * @param message to be sent forward
	 * @param address to forward message
	 */
	Pzp.prototype.sendMessage = function (message, address) {
		var self = this;
		var buf = new Buffer('#'+JSON.stringify(message)+'#');
		utils.debug(2, 'PZP Send to '+ address + ' Message '+JSON.stringify(message));
		
		try {
		if (self.connectedWebApp[address]) { // it should be for the one of the apps connected.
			utils.debug(2, "PZP (" + self.sessionId +")  Message forwarded to connected app "+address);
			self.connectedWebApp[address].socket.pause();
			self.connectedWebApp[address].sendUTF(JSON.stringify(message));
			process.nextTick(function () {
				self.connectedWebApp[address].socket.resume();
			});
		} else if (self.connectedPzp[address]) {
			utils.debug(2, "PZP (" + self.sessionId +")  Sending message to Client/Server PZP " +address);
			self.connectedPzp[address].socket.pause();
			self.connectedPzp[address].socket.write(buf);
			process.nextTick(function () {
				self.connectedPzp[address].socket.resume();
			});
		} else if(self.connectedPzh[address]){
			// This is for communicating with PZH
			utils.debug(2, "PZP (" + self.sessionId +")  Message sending to PZH " + address);
			self.connectedPzh[address].socket.pause();//socket.socket.
			self.connectedPzh[address].socket.write(buf);
			process.nextTick(function () {
				self.connectedPzh[address].socket.resume();
			});
		} 
		} catch (err) {
			utils.debug(1, 'PZP (' + self.sessionId + ': Exception' + err);
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
		}

	};	
	
	/** @decription Generates self signed certificate, crl, private key and certificate request. Certificate creation is done only first time Pzp starts
	 * crypto sensitive function
	 * @returns {function} callback pzp certificate to use for connecting pzh. 
	 */
	Pzp.prototype.checkFiles = function (callback) {
		var self, options;
		self = this;
		fs.readFile(self.config.master.cert.name, function (err) {
			if (err !== null && err.code === 'ENOENT') {		
				utils.selfSigned(self, 'Pzp', self.config.conn, function (status) {
					if (status === 'certGenerated') {
						fs.writeFileSync(self.config.conn.key.name, self.config.conn.key.value);
						options = {
							key: self.config.conn.key.value,
							cert: self.config.conn.cert.value
						};
						callback.call(self, options);
					}
				});
			} else {
				if(self.sessionId && tlsId[self.sessionId] !== '') {
					options = {session: tlsId[self.sessionId]};
					callback.call(self, options);

				} else {
					self.config.conn.cert.value = fs.readFileSync(self.config.conn.cert.name).toString();
					self.config.conn.key.value = fs.readFileSync(self.config.conn.key.name).toString();
					self.config.master.cert.value = fs.readFileSync(self.config.master.cert.name).toString();
					options = {
						key: self.config.conn.key.value,
						cert: self.config.conn.cert.value,
						ca: self.config.master.cert.value
					};
					callback.call(self, options);
				}
			}
		});
	};
	
	Pzp.prototype.authenticated = function(cn, client, callback) {
		var self = this;
		self.pzhId = cn;
		utils.debug(2, 'PZP Connected to PZH & Authenticated');
		self.sessionId = self.pzhId + "/" + self.config.common.split(':')[0];
		self.connectedPzh[self.pzhId] = {socket: client};
		self.pzpAddress = client.socket.address().address;
		self.tlsId[self.sessionId] = client.getSession();
		var msg = messaging.registerSender(self.sessionId, self.pzhId);
		self.sendMessage(msg, self.pzhId);
		self.startServer(function() {
			self.prepMsg(self.sessionId, self.pzhId, 'pzpDetails', self.pzpServerPort);
			callback.call(self, 'startedPZP');
		});
	};
	
	/* It is responsible for connecting with PZH and handling events.
	 * It does JSON parsing of received message
	 * @param config structure used for connecting with Pzh
	 * @param callback is called after connection is useful or fails to inform startPzp
	 */
	Pzp.prototype.connect = function (config, callback) {
		var self, client;
		self = this;
		try {
		client = tls.connect(self.pzhPort, 
			self.pzhName, 
			config, 
			function() {
				utils.debug(2,'PZP Connection to PZH status: ' + client.authorized );
				utils.debug(2,'PZP Reusing session : ' + client.isSessionReused());

				if(client.authorized){
					var cn = client.getPeerCertificate().subject.CN.split(':')[1];
					self.authenticated(cn, client, callback);
				} else {
					utils.debug(2, 'PZP: Not Authenticated ');
					self.pzhId = client.getPeerCertificate().subject.CN.split(':')[1];//data2.from;
					self.connectedPzh[self.pzhId] = {socket: client};
					self.prepMsg(self.sessionId, self.pzhId, 'clientCert',
						self.config.conn.csr.value); 
				}
			});
		} catch (err) {
			utils.debug(1, 'PZP: Connection Exception' + err);
			throw err;
		}
		
		/* It fetches data and forward it to processMsg
		* @param data is teh received data
		*/
		client.on('data', function(data) {
			try {
				client.pause(); // This pauses socket, cannot receive messages
				self.processMsg(data, callback);
				process.nextTick(function () {
					client.resume();// unlocks socket. 
				});			
			} catch (err) {
				utils.debug(1, 'PZP: Exception' + err);
				utils.debug(1, err.code);
				utils.debug(1, err.stack);			
			}			
		});
		
		client.on('end', function () {
			utils.debug(2, 'PZP ('+self.sessionId+') Connection teminated');
		});

		client.on('error', function (err) {
			utils.debug(1, 'PZP ('+self.sessionId+') Error connecting server' );
			utils.debug(1, err.stack);
		});

		client.on('close', function () {
			utils.debug(2, 'PZP ('+self.sessionId+') Connection closed by PZH');
		});
		
	};
	
	Pzp.prototype.processMsg = function(data, callback) {
		var self = this;
		var  msg, i ;
		utils.processedMsg(self, data, 1, function(data2) { // 1 is for #	
			if(data2.type === 'prop' && data2.payload.status === 'signedCert') {
				utils.debug(2, 'PZP Writing certificates data ');
				self.config.conn.cert.value = data2.payload.message.clientCert;
				fs.writeFile(self.config.conn.cert.name, data2.payload.message.clientCert, 
				function() {
					self.config.master.cert.value = data2.payload.message.masterCert;
					fs.writeFile(self.config.master.cert.name, data2.payload.message.masterCert,
					function() {
						if(typeof callback !== "undefined") {
							callback.call(self, 'connectPZHAgain');
						}
					});
				});
			} // This is update message about other connected PZP
			else if(data2.type === 'prop' && 
				data2.payload.status === 'pzpUpdate') {
				utils.debug(2, 'PZP ('+self.sessionId+') Update PZPs details') ;
				msg = data2.payload.message;
				for ( i = 0; i < msg.length; i += 1) {
					if(self.sessionId !== msg[i].name) {
						if(!self.connectedPzp[msg[i].name]) {
							self.connectedPzp[msg[i].name] = {'address': msg[i].address, 'port': msg[i].port};
							if(msg[i].newPzp) {
								self.connectOtherPZP(msg[i]);
							}
							self.wsServerMsg("Pzp Joined " + msg[i].name);
							self.prepMsg(self.sessionId, self.sessionWebAppId, 'update', {pzp: msg[i].name });		
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
		var self = this, otherPzp = [], mykey1, mykey2, otherPzh = [], payload;
		self.sessionWebAppId = self.sessionId+ '/'+self.sessionWebApp;
		self.sessionWebApp += 1;
		self.connectedWebApp[self.sessionWebAppId] = connection;
		for(mykey1 in self.connectedPzp) {
			if(self.connectedPzh.hasOwnProperty(mykey1)) {
				otherPzp.push(mykey1);
			}
		}
		
		for(mykey2 in self.connectedPzh) { 
			if(self.connectedPzh.hasOwnProperty(mykey2)) {
				otherPzh.push(mykey2);
			}
		}
		
		payload = {'pzhId':self.pzhId,'connectedPzp': otherPzp,'connectedPzh': otherPzh};
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
			utils.debug(2, 'PZP (Not Connected) '+result);
			client.checkFiles(function(config) {
				utils.debug(2, 'PZP (Not Connected) Client Connecting ');			
				try {
					client.connect(config, function(result) {
						if (result === 'connectPZHAgain') {
							utils.debug(2, 'PZP ('+client.sessionId+') Client Connecting Again');
							var config = {	key: client.config.conn.key.value,
								cert: client.config.conn.cert.value,
								ca: client.config.master.cert.value};

							client.connect(config, function(result) {
								if(result === 'startedPZP' && typeof callback !== "undefined") {
									callback.call(client, 'startedPZP');
								}
							});
						} else if(result === 'startedPZP' && typeof callback !== "undefined") {
							callback.call(client, 'startedPZP');
						}
					});
				} catch (err) {
					return undefined; 
				}
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
	sessionPzp.getPzpSessionId = function() {
		if (typeof sessionPzp.instance !== 'undefined') {
			return sessionPzp.instance.sessionId;
		}
		return "virgin_pzp";
	};
	
	sessionPzp.getPzhSessionId = function() {
		if (typeof sessionPzp.instance !== 'undefined') {
			return sessionPzp.instance.pzhId;
		}
		return undefined;
	};

	sessionPzp.getConnectedPzhId = function() {
		var mykey, obj;
		if (typeof sessionPzp.instance !== 'undefined') {
			for(mykey in sessionPzp.instance.connectedPzh) {
				if(sessionPzp.instance.connectedPzh.hasOwnProperty(mykey)) {
					obj.push(mykey);
				}
			}
			return obj;
		}
		return undefined;
	};
	
	sessionPzp.getConnectedPzpId = function() {
		var mykey, obj;
		if (typeof sessionPzp.instance !== 'undefined') {
			for(mykey in sessionPzp.instance.connectedPzp) {
				if(sessionPzp.instance.connectedPzp.hasOwnProperty(mykey)) {
					obj.push(mykey);
				}
			}
			return obj;
		}
		return undefined;
	};

	sessionPzp.startWebSocketServer = function(hostname, serverPort, webServerPort) {
		var id = 0, 
			connectedApp ={},
			http = require('http'),
			url = require('url'),
			sessionPzh = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/session_pzh.js')),
			
			WebSocketServer = require('websocket').server;				
		
		function getContentType(uri) {
			var contentType = {"Content-Type": "text/plain"};
			switch (uri.substr(uri.lastIndexOf('.'))) {
			case '.js':
				contentType = {"Content-Type": "application/x-javascript"};
				break;
			case '.html':
				contentType = {"Content-Type": "text/html"};
				break;
			case '.css':
				contentType = {"Content-Type": "text/css"};
				break;
			case '.jpg':
				contentType = {"Content-Type": "image/jpeg"};
				break;
			case '.png':
				contentType = {"Content-Type": "image/png"};
				break;
			case '.gif':
				contentType = {"Content-Type": "image/gif"};
				break;
		    }
		    return contentType;
		}

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
					response.writeHead(200, getContentType(filename));  
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
			utils.debug(2, "PZP WebServer: Listening on port "+webServerPort);
		});

		var httpserver = http.createServer(function(request, response) {
			utils.debug(2, "PZP WSServer: Received request for " + request.url);
			response.writeHead(404);
			response.end();
		});

		httpserver.on('error', function(err) {
			utils.debug(1, "PZP WSServer: got error " + err);
			if (err.code === 'EADDRINUSE') {
				// BUG why make up a port ourselves?
				serverPort = parseInt(serverPort, 10) +1; 
				utils.debug(1, "PZP WSServer: address in use, now trying port " + serverPort);
				httpserver.listen(serverPort, hostname);
			}
		});

		httpserver.listen(serverPort, hostname, function() {
			utils.debug(2, "PZP WSServer: Listening on port "+serverPort + 
				" and hostname "+hostname);

		});

		var wsServer = new WebSocketServer({
			httpServer: httpserver,
			autoAcceptConnections: true
		});		
		
		var messageWS = function (msg, address) {
			msg.resp_to = "virgin_pzp";
			// TODO why is "msg" a whole service object? we should only send the service info fields.
			if(connectedApp[address]) {
				connectedApp[address].sendUTF(JSON.stringify(msg));
			}
		};
			
		wsServer.on('connect', function(connection) {
			var pzh;
			utils.debug(2, "PZP WSServer: Connection accepted.");
			
			
			if(typeof sessionPzp.instance !== "undefined") {
				sessionPzp.instance.createWebAppSessionId(connection);
			} else {
				id += 1;
				connectedApp["virgin_pzp"+'/'+id] = connection;
				var payload = {type:"prop", from:"virgin_pzp", to: "virgin_pzp"+'/'+id, payload:{status:"registeredBrowser"}};
				connection.sendUTF(JSON.stringify(payload));
			}			

			connection.on('message', function(message) {
				//schema validation
				var msg;
				if(utils.checkSchema(message.utf8Data) === false)
					msg = JSON.parse(message.utf8Data);
				else {
					throw new Error('Unrecognized packet');	
				}
				utils.debug(2, 'PZP WSServer: Received packet ' + JSON.stringify(msg));

				// Each message is forwarded back to Message Handler to forward rpc message
				if(msg.type === 'prop' && msg.payload.status === 'registerBrowser') {
					sessionPzp.instance.createWebAppSessionId(connection);
				} else if(msg.type === 'prop' && msg.payload.status === 'startPzh') {
					pzh = sessionPzh.startPzh(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport, 
						function(result) {
							if(result === 'startedPzh') {
							var msg = {'type':'prop', 'payload':
							{'status':'info', 'message':"Pzh " + pzh.sessionId + " started"}};
							connection.sendUTF(JSON.stringify(msg));
							}
						});
				} else if(msg.type === 'prop' && msg.payload.status === 'startPzp') {
					if(sessionPzp.instance !== "null") {
						sessionPzp.instance = sessionPzp.startPzp(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport,
						function() {
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
					if( typeof pzh !== "undefined") {
						pzh.connectOtherPZH(msg.payload.servername, msg.payload.serverport, function(result) {
							sessionPzp.instance.wsServerMsg("Pzh " + result + "Connected");
						});
					}
				} else {
					if( typeof sessionPzp.instance !== "undefined" ) {
						utils.sendMessageMessaging(sessionPzp.instance, msg);
					} else {
						messaging.setGetOwnId("virgin_pzp");
						messaging.setSendMessage(messageWS);
						messaging.setSeparator("/");
						messaging.onMessageReceived(msg, msg.to);
					}
				}
			});
			connection.on('close', function(connection) {
					utils.debug(2, "PZP WSServer: Peer " +
						connection.remoteAddress + " disconnected.");
			});	
		});
		
	};
	
	Pzp.prototype.connectOtherPZP = function (msg) {
		var self, client;
		self = this;
		var options = {	key: self.config.conn.key.value,
				cert: self.config.conn.cert.value,
				ca: self.config.master.cert.value
				};

		client = tls.connect(msg.port, msg.address, options, function () {
			if (client.authorized) {
				utils.debug(2, "PZP (" + self.sessionId + ") Client: "+
				 " Authorized & Connected to PZP: " + msg.address );
				self.connectedPzp[msg.name] = {socket: client};
				var msg1 = messaging.registerSender(self.sessionId, msg.name);
				self.sendMessage(msg1, msg.name); 
			} else {
				utils.debug(2, "PZP (" + self.sessionId +") Client: Connection failed,"+ 
				"first connect with PZH to download certificated");
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
			utils.debug(2, "PZP (" + self.sessionId +") Client: Connection teminated");
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

	Pzp.prototype.startServer = function (callback) {
		var self, server;
		self = this;
		// Read server configuration for creating TLS connection
		var config = {	key: self.config.conn.key.value,
				cert: self.config.conn.cert.value,
				ca:self.config.master.cert.value,
				requestCert:true, 
				rejectUnauthorized:true
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
					self.connectedPzp[sessionId]= {socket: conn,
					address: conn.socket.remoteAddress, port: ''};
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
				server.listen(self.pzpServerPort, self.ipaddr);
			}
		});

		server.on('listening', function () {
			utils.debug(2, "PZP Server ("+self.sessionId+")  listening as server on port :" 
				+ self.pzpServerPort + " address : "+ self.pzpAddress);
			callback.call(self, 'started');
		});				
			
		server.listen(self.pzpServerPort, self.pzpAddress);
	};

	if (typeof exports !== 'undefined') {
		exports.startPzp = sessionPzp.startPzp;
		exports.startWebSocketServer = sessionPzp.startWebSocketServer;
		exports.send = sessionPzp.send; 
		exports.instance = sessionPzp.instance;
		exports.getPzpSessionId = sessionPzp.getPzpSessionId; 
		exports.getPzhSessionId = sessionPzp.getPzhSessionId; 
		exports.disconnectPZP = sessionPzp.disconnectPZP;
		exports.getConnectedPzpId = sessionPzp.getConnectedPzpId;
		exports.getConnectedPzhId = sessionPzp.getConnectedPzhId;
	}

}());
