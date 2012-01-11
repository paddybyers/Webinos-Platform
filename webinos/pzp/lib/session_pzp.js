/**
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
* @description It starts Pzp and handle communication with web socket server. Websocket server allows starting Pzh and Pzp via a web browser
*/
(function () {
	"use strict";
	
	var path = require('path');
	var moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
	var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
	var webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location);
	var webinosDemo = path.resolve(__dirname, '../../../demo');
		
	if (typeof exports !== "undefined") {
		var rpc = require(path.join(webinosRoot, dependencies.rpc.location, 'lib/rpc.js'));
		var RPCHandler = rpc.RPCHandler;
		var messaging = require(path.join(webinosRoot, dependencies.manager.messaging.location, 'lib/messagehandler.js'));
		
		var utils = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
	}
	
	var tls = require('tls');
	var fs = require('fs');
	var Pzp = null; 
	var tlsId = '', instance;
	var sessionPzp = [];	
	var connectedApp ={};
	var webId = 0;
	var pzpCertDir;
	Pzp = function (modules) {
		// Stores PZH server details
		this.connectedPzh= [];
		this.connectedPzhIds = [];
		
		// Stores connected PZP information
		this.connectedPzp = {};
		this.connectedPzpIds = [];
		
		// List of connected apps i.e session with browser
		this.connectedWebApp = {};
		
		// sessionWebApp for the connected web pages
		this.sessionWebApp = 0;		
		
		//Configuration details of Pzp (certificates, file names)
		this.config = {};
		
		// Default port to be used by PZP Server
		this.pzpServerPort = 8040;
		
		// Used for session reuse
		this.tlsId = '';
		
		// Code used for the first run to authenticate with PZH.
		this.code = null;
		
		// Handler for remote method calls.
		this.rpcHandler = new RPCHandler();
		messaging.setRPCHandler(this.rpcHandler);
		
		// load specified modules
		this.rpcHandler.loadModules(modules);
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
			utils.debug(1, 'PZP (' + self.sessionId + 'Error in sending send message');
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
		}

	};	
	
	
	
	/** @decription Generates self signed certificate, crl, private key and certificate request. Certificate creation is done only first time Pzp starts
	 * crypto sensitive function
	 * @returns {function} callback pzp certificate to use for connecting pzh. 
	 */
	Pzp.prototype.checkFiles = function (callback) {
		
		var self = this, options;		
		var pzpRoot = webinosDemo+'/certificates/pzp';
		var pzpName = pzpRoot+'/'+self.config.common.split(':')[0];
		//This is a global, don't be fooled into thinking it needs to be a var.
		pzpCertDir = path.resolve(__dirname, pzpName+'/cert');
		var pzpKeyDir = path.resolve(__dirname, pzpName+'/keys');		
		
		//Check that all the directories exist.
		if (!path.existsSync(webinosDemo+'/certificates')) {
		    fs.mkdirSync(webinosDemo+'/certificates', '0700');
		}
		if (!path.existsSync(pzpRoot)) {
		    fs.mkdirSync(pzpRoot, '0700');
		}
		if (!path.existsSync(pzpName)) {
		    fs.mkdirSync(pzpName, '0700');
		}
		if (!path.existsSync(pzpCertDir)) {
		    fs.mkdirSync(pzpCertDir, '0700');
		}
		if (!path.existsSync(pzpKeyDir)) {
		    fs.mkdirSync(pzpKeyDir, '0700');
		}
		
		
		
		if (!path.existsSync(pzpCertDir+'/'+self.config.master.cert.name)) {
		    //We have no certificates - create some which are self-signed.
		    utils.selfSigned(self, 'Pzp', self.config.conn, function (status, selfSignErr) {
				if (status === 'certGenerated') {
		            		fs.writeFileSync(pzpKeyDir+'/'+self.config.conn.key.name, self.config.conn.key.value);
					options = {key: self.config.conn.key.value, cert: self.config.conn.cert.value};
					callback.call(self, options);
				}
		        } else {
					utils.debug(1, 'creating certificated failed.');			
					if (typeof selfSignErr !== 'undefined') {
						utils.debug(1, 'cert manager error: ' + selfSignErr);
					}
		            callback.call(self, status);
		        }
		    });
		} else {
			if(self.sessionId && tlsId.hasOwnProperty(self.sessionId) ) {
				//resuming an old session
				options = {'session': tlsId[self.sessionId]};
				callback.call(self, options);

			} else {
			    //reusing existing certificates.
				self.config.conn.cert.value = fs.readFileSync(pzpCertDir+'/'+self.config.conn.cert.name).toString();
				self.config.conn.key.value = fs.readFileSync(pzpKeyDir+'/'+self.config.conn.key.name).toString();
				self.config.master.cert.value = fs.readFileSync(pzpCertDir+'/'+self.config.master.cert.name).toString();
				if (path.existsSync(self.config.master.crl.name)) {					
						//we wont have a CRL until someone synchronises it.
						self.config.master.crl.value = fs.readFileSync(pzpCertDir+'/'+self.config.master.crl.name).toString();
				}
				options = {
					key: self.config.conn.key.value,
					cert: self.config.conn.cert.value,
					ca: self.config.master.cert.value,
					crl: self.config.master.crl.value
				};
				callback.call(self, options);
			} 
		}
	};
	
	sessionPzp.getPzpId = function() {
		if (typeof instance !== "undefined") {
			return instance.sessionId;
		} else { 
			return "virgin_pzp";
		}
	}
	
	sessionPzp.getPzhId = function() {
		if (typeof instance !== "undefined") {
			return instance.pzhId;
		} else { 
			return "undefined";
		}
	}
	
	sessionPzp.getConnectedPzhId = function() {
		if (typeof instance !== "undefined") {
			return instance.connectedPzhIds;
		} else { 
			return [];
		}
	}
	
	sessionPzp.getConnectedPzpId = function() {
		if (typeof instance !== "undefined") {
			return instance.connectedPzpIds;
		} else { 
			return [];
		}
	}
	
	Pzp.prototype.authenticated = function(cn, client, callback) {
		var self = this;
		if(!self.connectedPzp.hasOwnProperty(self.sessionId)) {
			utils.debug(2, 'PZP Connected to PZH & Authenticated');
			self.pzhId = cn;				
			self.sessionId = self.pzhId + "/" + self.config.common.split(':')[0];
			self.connectedPzh[self.pzhId] = {socket: client};
			self.connectedPzhIds.push(self.pzhId);
			self.connectedPzp[self.sessionId] = {socket: client};
			self.pzpAddress = client.socket.address().address;
			self.tlsId[self.sessionId] = client.getSession();
			var msg = messaging.registerSender(self.sessionId, self.pzhId);		
			self.sendMessage(msg, self.pzhId);
			self.startServer(function() {
				self.prepMsg(self.sessionId, self.pzhId, 'pzpDetails', self.pzpServerPort);
				
				self.prepMsg(self.sessionId, self.pzhId, 'findServices', self.pzpServerPort);
				utils.debug(2, 'Sent msg to findServices');
				
				callback.call(self, 'startedPZP');
			});
		}
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
			client = tls.connect(self.pzhPort, self.pzhName, config, 
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
						{   csr: self.config.conn.csr.value, 
						    name: self.config.common.split(':')[0],
						    code: self.code //"DEBUG"
					    }); 
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
			var webApp;
			utils.debug(2, 'PZP ('+self.sessionId+') Connection terminated');
			messaging.removeRoute(self.pzhId, self.sessionId);
			delete self.connectedPzh[self.pzhId];
			delete self.connectedPzp[self.sessionId];
			self.pzhId = '';
			self.sessionId = 'virgin_pzp';
			instance = '';
			for ( webApp in self.connectedWebApp ) {
				if (self.connectedWebApp.hasOwnProperty(webApp)) {
					var addr = 'virgin_pzp' + '/' + webId;
					webId += 1;
					connectedApp[addr] = self.connectedWebApp[webApp];
					var payload = {type:"prop", from:"virgin_pzp", to: addr, payload:{status:"registeredBrowser"}};
					connectedApp[addr].sendUTF(JSON.stringify(payload));		
				}
			}
		});

		client.on('error', function (err) {
			utils.debug(1, 'PZP ('+self.sessionId+') Error connecting server' );
			utils.debug(1, err.stack);
		});

		client.on('close', function () {
			utils.debug(2, 'PZP ('+self.sessionId+') Connection closed');
		});
		
	};
	
	Pzp.prototype.processMsg = function(data, callback) {
		var self = this;
		var  msg, i ;		
		utils.processedMsg(self, data, 1, function(data2) { // 1 is for #	
			if(data2.type === 'prop' && data2.payload.status === 'signedCert') {
				utils.debug(2, 'PZP Writing certificates data ');				
				self.config.conn.cert.value = data2.payload.message.clientCert;
				fs.writeFile(pzpCertDir+'/'+self.config.conn.cert.name, data2.payload.message.clientCert, 
				function() {
					self.config.master.cert.value = data2.payload.message.masterCert;
					fs.writeFile(pzpCertDir+'/'+self.config.master.cert.name, data2.payload.message.masterCert,
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
						if(!self.connectedPzp.hasOwnProperty(msg[i].name)) {
							self.connectedPzp[msg[i].name] = {'address': msg[i].address, 'port': msg[i].port};
							self.connectedPzpIds.push(msg[i].name);
							if(msg[i].newPzp) {
								self.connectOtherPZP(msg[i]);
							}
							self.wsServerMsg("Pzp Joined " + msg[i].name);
							self.prepMsg(self.sessionId, self.sessionWebAppId, 'update', {pzp: msg[i].name });		
						}
					}
				}	
			} else if(data2.type === 'prop' && data2.payload.status === 'failedCert') {
                utils.debug(1, "Failed to get certificate from PZH");                
			    callback.call(self, "ERROR");
			    
			} else if(data2.type === 'prop' && 
					data2.payload.status === 'foundServices') {
				utils.debug(2, 'PZP ('+self.sessionId+') findServices dude!!!');
				
				this.rpcHandler.setServicesFromPzh(data2.payload.message);
			}
			// Forward message to message handler
			else {
				rpc.SetSessionId(self.sessionId);
				utils.sendMessageMessaging(self, data2);
			}
		});
	};	
	
	/* starts pzp, creates client, start servers and event listeners
	 * @param server name
	 * @param port: port on which PZH is running
	 */
	sessionPzp.startPzp = function(contents, servername, port, code, modules, callback) {
		var client = new Pzp(modules);
		client.code = code;		
		client.pzhPort = port;
		utils.resolveIP(servername, function(resolvedAddress) {
			client.pzhName = resolvedAddress;
			utils.debug(3, 'connecting address: ' + client.pzhName);
			utils.configure(client, 'Pzp', contents, function(result) {
				utils.debug(2, 'PZP (Not Connected) '+result);
				client.checkFiles(function(config) {
					if(config !== 'failed') {
						utils.debug(2, 'PZP (Not Connected) Client Connecting ');			
						try {
							client.connect(config, function(result) {
								if (result === 'connectPZHAgain') {
									utils.debug(2, 'PZP ('+client.sessionId+') Client Connecting Again');
									var config = {	key: client.config.conn.key.value,
										cert: client.config.conn.cert.value,
										crl: client.config.master.crl.value,
										ca: client.config.master.cert.value};

									client.connect(config, function(result) {
										if(result === 'startedPZP' && typeof callback !== "undefined") {
											instance = client;
											callback.call(client, 'startedPZP');
											return;
										}
									});
								} else if(result === 'startedPZP' && typeof callback !== "undefined") {
									instance = client;
									callback.call(client, 'startedPZP');
									return;
								}
							});
						} catch (err) {
							return "undefined"; 
						}
					} else {
						return "undefined";
					}
				});		
			});
		});				
	};

	sessionPzp.startPzpWebSocketServer = function(hostname, serverPort, webServerPort) {
		var http = require('http'),
		url = require('url'),
		WebSocketServer = require('websocket').server;
		
		function getContentType(uri) {
			var contentType = 'text/plain';
		    switch (uri.substr(uri.lastIndexOf('.'))) {
		    case '.js':
		    	contentType = 'application/x-javascript';
		    	break;
		    case '.html':
		    	contentType = 'text/html';
		    	break;
		    case '.css':
		    	contentType = 'text/css';
		    	break;
		    case '.jpg':
		    	contentType = 'image/jpeg';
		    	break;
		    case '.png':
		    	contentType = 'image/png';
		    	break;
		    case '.gif':
		    	contentType = 'image/gif';
		    	break;
		    }
		    return {'Content-Type': contentType};
		}

		var cs = http.createServer(function(request, response) {  
			var uri = url.parse(request.url).pathname;  
			var filename = path.join(webinosDemo, uri);  
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
			utils.debug(2, "PZP WSServer: Listening on port "+serverPort + " and hostname "+hostname);

		});

		var wsServer = new WebSocketServer({
			httpServer: httpserver,
			autoAcceptConnections: true
		});
		
		function messageWS (msg, address) {
			msg.from = "virgin_pzp";
			// TODO why is "msg" a whole service object? we should only send the service info fields.
			if(connectedApp[address]) {
				connectedApp[address].sendUTF(JSON.stringify(msg));
			}
		}
		
		function connectedApp (connection) {			
			if(typeof instance !== "undefined" && typeof instance.sessionId !== "undefined") {
				instance.sessionWebAppId  = instance.sessionId+ '/'+ instance.sessionWebApp;
				instance.sessionWebApp  += 1;
				instance.connectedWebApp[instance.sessionWebAppId] = connection;
				payload = {'pzhId':instance.pzhId,'connectedPzp': instance.connectedPzpIds,'connectedPzh': instance.connectedPzhIds};
				instance.prepMsg(instance.sessionId, instance.sessionWebAppId, 'registeredBrowser', payload);  
			} else {
				webId += 1;
				var payload, addr = "virgin_pzp"+'/'+webId;
				connectedApp[addr] = connection;
				payload = {type:"prop", from:"virgin_pzp", to: addr , payload:{status:"registeredBrowser"}};
				messageWS(payload, addr);
			}		
		}
		
		wsServer.on('connect', function(connection) {
			utils.debug(2, "PZP WSServer: Connection accepted.");
			connectedApp(connection);
			
			connection.on('message', function(message) {
				//schema validation
				var msg;
				//if(utils.checkSchema(message.utf8Data) === false){
					msg = JSON.parse(message.utf8Data);
				//}else {
				//	throw new Error('Unrecognized packet');	
				//}
				utils.debug(2, 'PZP WSServer: Received packet ' + JSON.stringify(msg));

				// Each message is forwarded back to Message Handler to forward rpc message
					if(msg.type === 'prop' ){
						if( msg.payload.status === 'startPzp' ) {
						instance = sessionPzp.startPzp(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport,
						msg.payload.code,
						msg.payload.modules,
						function(status) {
							if(typeof status !== "undefined") {
								connectedApp(connection);
								instance.wsServerMsg("Pzp " + instance.sessionId+ " started");
							}
						});
					} else if(msg.payload.status === 'disconnectPzp') {
						if( typeof instance !== "undefined" && typeof instance.sessionId !== "undefined") {
							if(instance.connectedPzp.hasOwnProperty(instance.sessionId)) {
								instance.connectedPzp[instance.sessionId].socket.end();
								instance.wsServerMsg("Pzp "+instance.sessionId+" closed");
							}
						}
					}
					else if(msg.payload.status === 'registerBrowser') {
						connectedApp(connection);
					}
				} else {
					if( typeof instance !== "undefined" && typeof instance.sessionId !== "undefined") {
						rpc.SetSessionId(instance.sessionId);
						utils.sendMessageMessaging(instance, msg);
					} else {
						rpc.SetSessionId("virgin_pzp");
						messaging.setGetOwnId("virgin_pzp");
						messaging.setSendMessage(messageWS);
						messaging.setSeparator("/");
						messaging.onMessageReceived(msg, msg.to);
					}
				}
			});
			connection.on('close', function(connection) {
					utils.debug(2, "PZP WSServer: Peer " + connection.remoteAddress + " disconnected.");
			});	
		});
		
	};
	
	Pzp.prototype.connectOtherPZP = function (msg) {
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

	Pzp.prototype.startServer = function (callback) {
		var self = this, server;
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

	if (typeof exports !== 'undefined') {
		exports.startPzp = sessionPzp.startPzp;
		exports.startPzpWebSocketServer = sessionPzp.startPzpWebSocketServer;
		exports.getPzpId = sessionPzp.getPzpId;
		exports.getPzhId = sessionPzp.getPzhId;
		exports.getConnectedPzhId = sessionPzp.getConnectedPzpId;
		exports.getConnectedPzpId = sessionPzp.getConnectedPzpId;		
	}

}());
