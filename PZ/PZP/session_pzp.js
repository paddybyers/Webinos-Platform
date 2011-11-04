/* It is a client to PZH
 * It runs two servers:
 ** TLS server for allowing other PZP's to connect to it
 ** WebSocket Server to allow websocket connection with the browser
 * It is dependent on session common and messaging
 */
(function () {
	"use strict";
	if (typeof webinos === "undefined") {
		webinos = {};
		/* This is the base object for webinos.session
		*/
		
	}
	var sendDataStatus = true;
	var nextData = {};
	var data3 = '';
	webinos.session = {};
	/* This is base object for webinos.session.pzh
	*/
	webinos.session.pzh = require('./session_pzh.js');
	/*This is base object for webinos.session.pzp
	*/
	webinos.session.pzp = {};
	/* 
	*/
	webinos.session.common = require('./session_common.js');

	
	if (typeof exports !== "undefined") {
		webinos.message = require("./messaging.js");
	}

	webinos.session.pzp.send = function (object, message, address) {
		object.sendMessage((message), address);
	};
 
	var tls = require('tls'),
		fs = require('fs'),
		http = require('http'),
		url = require('url'),
		path = require('path'),
		WebSocketServer = require('websocket').server,
		Pzp = null;

	Pzp = function () {
		// Stores PZH server details
		this.serverName = [];
		// Stores own id, this is generated by PZH
		this.sessionId = 0;
		// ServiceSessionId for the connected Apps
		this.serviceSessionId = 0;
		//Configuration details
		this.config = {};
		// List of other connected PZH to PZH. 
		this.otherPZP = [];
		// Stores connected PZP information
		this.connected_pzp = {};
		//Stores particular client socket information
		this.clientSocket = {};
		// It is used by PZP server for holding list of PZP
		this.connectedClient = [];
		// List of connected apps i.e session with browser
		this.connected_app = {};

		this.client_pzp = {};
		
		this.connAppId = null;
		this.instance = null;
	};

	//This structure holds socket connection information of the server.
	//self.clientSocket = {};

	Pzp.prototype = new process.EventEmitter();

	/* It is responsible for sending message to correct entity. It checks if message is
	 * for Apps connected via WebSocket server. It forwards message to the correct 
	 * WebSocket client or else message is send to PZH
	 * @param message to be sent forward
	 */
	Pzp.prototype.sendMessage = function (message, address) {
		var self = this;
		if (self.connected_app[address]) { // it should be for the one of the apps connected.
			webinos.session.common.debug("PZP (" + self.config.sessionId +
				")  Message forwarded to connected app on websocket server ");
			self.connected_app[address].sendUTF(JSON.stringify(message));
		} else if (self.client_pzp[address]) {
			webinos.session.common.debug("PZP (" + self.config.sessionId +
				")  Sending message to Server PZP");
			self.client_pzp[address].write('#'+JSON.stringify(message));
		} else if (self.connected_pzp[address]) {
			webinos.session.common.debug("PZP (" + self.config.sessionId +
				")  Sending message to Client PZP ");
			self.connected_pzp[address].socket.write('#'+JSON.stringify(message));
		} else if (address === self.serverName) {
			// This is for communicating with PZH
			if(sendDataStatus) {
				webinos.session.common.debug("PZP (" + self.config.sessionId +
					")  Message Addressed to PZH ");
				sendDataStatus = self.clientSocket.write('#'+JSON.stringify(message));
				//self.clientSocket.socket.flush();
			}			

		} else {
			if(sendDataStatus) {
				webinos.session.common.debug("PZP (" + self.config.sessionId +
					") No where to send sending to PZH ");
				sendDataStatus = self.clientSocket.write('#'+JSON.stringify(message));
				//self.clientSocket.socket.flush();
			}
		}

	};

	Pzp.prototype.setServiceSessionId = function () {
		this.serviceSessionId += 1;
		return this.serviceSessionId;
	};
	/* Similar to PZH with only difference that it generates self signed certificate, 
	 * in case if certificates are found it updates the structure.
	 */
	Pzp.prototype.checkFiles = function (callback) {
		var self, options;
		self = this;
		fs.readFile(self.config.keyname, function (err) {
			if (err) {
				webinos.session.common.generateSelfSignedCert(self, function (status) {
					if (status === 'true') {
						options = {
							key: fs.readFileSync(self.config.keyname),
							cert: fs.readFileSync(self.config.certname)
						};
						callback.call(self, options);
					}
				});
			} else {
				options = {
					key: fs.readFileSync(self.config.keyname),
					cert: fs.readFileSync(self.config.certname),
					ca: fs.readFileSync(self.config.mastercertname)
				};
				callback.call(self, options);
			}
		});

	};


	Pzp.prototype.connectOtherPZP = function (msg) {
		var self, client;
		self = this;
		var options = {	key: fs.readFileSync(self.config.keyname),
				cert: fs.readFileSync(self.config.certname),
				ca: fs.readFileSync(self.config.mastercertname)
				};
		client = tls.connect(msg.port, msg.address, options, function (conn) {
			if (client.authorized) {
				webinos.session.common.debug("PZP Client (" + self.config.sessionId +
					")  Authorized & Connected to PZP: " + msg.address );
				self.client_pzp[msg.name] =  client;
				var msg1 = webinos.message.registerSender(self.sessionId, msg.name);
				self.sendMessage(msg1, msg.name); 
			}
		});
	
		client.on('data', function (data) {
			var data1 = JSON.parse(data);			
			webinos.session.common.debug("PZP Client (" + self.config.sessionId +
				")  Received data ");
			webinos.session.common.debug("PZP Client (" + self.config.sessionId +
				")  Message Forward to Message Handler" + JSON.stringify(data1));
			webinos.message.setGet(self.sessionId);
			webinos.message.setObject(self);
			webinos.message.setSend(webinos.session.pzp.send);
			webinos.message.onMessageReceived(data1);
		
		});

		client.on('end', function () {
			webinos.session.common.debug("PZP Client (" + self.config.sessionId +
				")  Connection teminated");
		});
	
		client.on('error', function (err) {
			webinos.session.common.debug("PZP Client (" + self.config.sessionId +
				")  Error connecting server" + err.stack);	
		});

		client.on('close', function () {
			webinos.session.common.debug("PZP Client (" + self.config.sessionId +
				")  Connection closed by PZP Server");
		});
	
	

	};

	Pzp.prototype.startServer = function (callback) {
		var self, server;
		self = this;
		// Read server configuration for creating TLS connection
		var options = {	key: fs.readFileSync(self.config.keyname),
				cert: fs.readFileSync(self.config.certname),
				ca:fs.readFileSync(self.config.mastercertname),
				requestCert:true, 
				rejectUnauthorized:true
				};

		server = tls.createServer(options, function (conn) {
			var cn, parse = null, sessionId;
			/* If connection is authorized:
			* SessionId is generated for PZP. Currently it is PZH's name and 
			* PZP's CommonName and is stored in form of PZH::PZP.
			* registerClient of message manager is called to store PZP as client of PZH
			* Connected_client list is sent to connected PZP. Message sent is with payload 
			* of form {status:'Auth', message:self.connected_client} and type as prop.
			*/
			if (conn.authorized) {
				webinos.session.common.debug("PZP Server: Client Authenticated ");
				cn = conn.getPeerCertificate().subject.CN;
			
				sessionId = self.serverName + '/' +cn.split(':')[0];

				self.connected_pzp[sessionId] = {'socket': conn, 
												'name': sessionId, 
												'address': conn.socket.remoteAddress, 
												'port': '',
												'object': ''};
				webinos.session.common.debug("PZP Server (" + self.config.sessionId +
					") connected_pzp ");
			} 
				
			conn.on('connection', function () {
				webinos.session.common.debug("PZP Server (" + self.config.sessionId +
					")  Connection established");
			});
		
			conn.on('data', function (data) {
				webinos.session.common.debug("PZP Server (" + self.config.sessionId +
					")  Read bytes = " 	+ data.length);
				parse = JSON.parse(data);
				if (parse.type === 'prop' && parse.payload.status === 'pzpDetails') {
					if(self.connected_pzp[parse.from]) {
						self.connected_pzp[parse.from].port = parse.payload.port;
						self.connected_pzp[parse.from].object = parse.payload.object;
					} else {
						webinos.session.common.debug("PZP Server (" + self.config.sessionId +
						") Received PZP details from entity which is not registered : " + parse.from);
					}
				} else {
					 // Message is forwarded to Message handler function, onMessageReceived
					webinos.message.setGet(self.sessionId);
					webinos.message.setSend(webinos.session.pzp.send);
					webinos.message.setObject(self);
					webinos.message.onMessageReceived(parse);
				}
			
			});

			conn.on('end', function () {
				webinos.session.common.debug("PZP Server (" + self.config.sessionId +
					")  server connection end");
			});

			// It calls removeClient to remove PZP from connected_client and connected_pzp.
			conn.on('close', function() {
				webinos.session.common.debug("PZP Server ("+self.config.sessionId+")  socket closed");
			});

			conn.on('error', function(err) {
				webinos.session.common.debug("PZP Server ("+self.config.sessionId+")"  + err.code + 
							"\n PZP Server: Error stack : " + err.stack);
			});
		});
	
		server.on('error', function (err) {
			if (err.code === 'EADDRINUSE') {
				webinos.session.common.debug("PZP Server ("+self.config.sessionId+")  Address in use");
				self.pzp_serverPort = parseInt(self.pzp_serverPort, 10) + 1;
				server.listen(self.pzp_serverPort, self.ipaddr);
			}
		});

		server.on('listening', function () {
			webinos.session.common.debug("PZP Server ("+self.config.sessionId+")  listening as server on port :" 
						+ self.pzp_serverPort);
			callback.call(self, 'started');
		});				
			
		server.listen(self.pzp_serverPort, self.ipaddr);
	};
	/* It is responsible for connecting with PZH and handling events.
	 * It does JSON parsing of received message../../RPC/contacts_module/node_contacts_remote/build/config.log
	 */
	 
	Pzp.prototype.connect = function (options, callback) {
		var self, client, msg = {};
		self = this;

		client = tls.connect(self.pzh_serverPort, 
			self.pzh_serverName, 
			options, 
			function(conn) {
				webinos.session.common.debug('PZP (' + self.config.sessionId +
					') Connection to PZH status: ' + client.authorized);
				//client.setNoDelay(true);	
				client.bufferSize = 65535;
				self.clientSocket = client;
			});

		client.on('data', function(data) {
			var  data2 = {}, myKey;
			//console.log('in data');
			//console.log(typeof data);
			//data1 = new Buffer(data, 'base64');
			//console.log(data1);
			//if(Buffer.isBuffer(data)) {
				//console.log("It is buffer");
			//}
			var data1 = {}, open = 0, i = 0, close = 0;
			
			try {
				client.pause();
					
				/*var multiMsg = data.toString('utf8').split('#');
				if(multiMsg.length > 1) {
					for(var i=0; i < multiMsg.length; i++) {
						if(multiMsg[i].length > 0) {
							client.emit('data', multiMsg[i]);
							return;
						}	
					}
				} else {
					data = multiMsg[0];
				}*/

				var msg = data.toString().split('#');
				if(msg[0]==='0' ) { 
					console.log(msg[1]);
					console.log(msg[2].length);
					console.log('PZP: Received msg' + msg[2]);
					if(data3 !== '') {
						data1 = data3 + msg[2].substr(0, msg[1]);
						data3 = '';
					} else {
						data1 = msg[2].substr(0, msg[1]);
					}
					data2 = JSON.parse(data1);
				} else if(msg[0] === '1'){
					debugger;
					data3 += msg[2].substr(0,msg[1]);					
					console.log('PZH: bigger message read');
					return;
				} else {
					return;
				}			

				/*if(typeof data === "string")
					data2 = JSON.parse(data);
				else 
					data2 = data;
				*/
				process.nextTick(function () {
					client.resume();
				});
						
				//console.log(data2);
				//data2 = JSON.parse(data, reviewer);
			
				/*function reviewer(key, value) {
					if(typeof value === "object") {
						console.log(key);
						console.log(value);						
					}
				}*/
				webinos.session.common.debug('PZP ('+self.config.sessionId+') Received data ');
				/* If sends the client certificate to get signed certificate from server. 
				 * Payload message format {status: 'clientCert', message: certificate)
				 */
				if (data2.type === 'prop' && 
					data2.payload.status === 'NotAuth' && 
					data2.to === self.config.sessionId) {
						webinos.session.common.debug('PZP ('+self.config.sessionId+') Not Authenticated');
						msg = { 'type': 'prop', 'payload': {'status':'clientCert', 
							'message':fs.readFileSync(self.config.certnamecsr).toString()}};
						self.sendMessage(msg);
				}
				/* It registers with message handler and set methods for message handler. 
				 * It also registers PZH as its client. To enable message to be sent from 
				 * message handler directly. It is responsible for starting server and 
				 * functionality is similar to PZH, except it does not generate certificates 
				 * for connecting PZP. If port is blocked it increments port before connecting.
				 */
				else if (data2.type === 'prop' && 
						data2.payload.status === 'Auth') {
							webinos.session.common.debug('PZP ('+self.config.sessionId+') Connected to PZH & Authenticated');
							self.serverName = data2.from;
							self.sessionId = data2.to;

							webinos.message.setGet(self.sessionId);
							webinos.message.setObject(self);
							webinos.message.setSend(webinos.session.pzp.send);
							msg = webinos.message.registerSender(self.sessionId, self.serverName);
							self.sendMessage(msg, self.serverName);
				
							self.startServer(function() {
								msg = { 'type': 'prop', 'from' : self.sessionId, 'to': self.serverName, 
										'payload': {'status': 'pzpDetails', 
													'port': self.pzp_serverPort, 
													'object':''/*webinos.rpc.object*/}
								};
								self.sendMessage(msg, self.serverName);
		
								setTimeout(function() {
									callback.call(self, 'startedPZP');
								}, 500);
							});
				} // It is signed client certificate by PZH
				else if(data2.type === 'prop' && 
						data2.payload.status === 'signedCert' && 
						self.config.sessionId === data2.to) {
							webinos.session.common.debug(self.config.sessionId);
							webinos.session.common.debug('PZP ('+self.config.sessionId+') Creating signed client cert ' 
								+self.config.certname + ' to ' + data2.to);
							fs.writeFile(self.config.certname, 
								data2.payload.clientCert, 
								function() {
									webinos.session.common.debug('PZP ('+self.config.sessionId+') Creating server signing cert '
										+self.config.mastercertname);
									fs.writeFile(self.config.mastercertname, 
										data2.payload.signingCert, 
										function() {
											if(typeof callback !== "undefined") {
												callback.call(self, 'connectPZHAgain');
											}
										});

								});
				} // This is update message about other connected PZP
				else if(data2.type === 'prop' && 
						data2.payload.status === 'PZPUpdate') {
							webinos.session.common.debug('PZP ('+self.config.sessionId+') Update other PZP details') ;
							msg = JSON.parse(data2.payload.message);
							for (myKey in msg) {
								if(self.sessionId !== msg[myKey].name && !self.client_pzp[msg[myKey].name]) {
									if(!self.connected_pzp[msg[myKey].name]) {
										self.connected_pzp[msg[myKey].name] = {'socket': '', 
													'name': msg[myKey].name, 
													'address': msg[myKey].address, 
													'port': msg[myKey].port,
													'object': ''};			
		
									self.connectOtherPZP(msg[myKey]);
									self.sendMessage({"type":"prop", "payload": {"status":"pzp_info", "message":msg[myKey].name}},
										webinos.session.pzp.instance.connAppId);
								}
							}
						}	
				}
				// Forward message to message handler
				else { 
					webinos.session.common.debug('PZP ('+self.config.sessionId+') Message Forward to Message Handler' + 
												JSON.stringify(data2));
					webinos.message.setGet(self.sessionId);
					webinos.message.setObject(self);
					webinos.message.setSend(webinos.session.pzp.send);
					webinos.message.onMessageReceived(data2);
				}
			} catch (err) {
				console.log('PZP: Exception' + err);
				console.log(err.code);
				console.log(err.stack);
				
			}
			
		});
		
		client.on('end', function () {
			webinos.session.common.debug('PZP ('+self.config.sessionId+') Connection teminated');
		});

		client.on('error', function (err) {
			webinos.session.common.debug('PZP ('+self.config.sessionId+') Error connecting server' + err.stack);	
		});

		client.on('close', function () {
			webinos.session.common.debug('PZP ('+self.config.sessionId+') Connection closed by PZH');
		});
	
		client.on('drain', function() {
			sendDataStatus = true;
		});
	};

	Pzp.prototype.configurePZP = function(contents, callback) {
		var self = this;
		var id;
		var name, i =0, j;
		var flag = true, common = '', data1;

		fs.readdir(__dirname, function(err, files) {
			for(i in files) {
				if( (files[i].indexOf('pzp',0) === 0) &&  
					files[i].indexOf('key.pem', 0) !== -1) {
						id = files[i].split('_');
						data1 = contents.toString().split('\n');
						for(j = 0; j < data1.length; j += 1) {
							if(data1[j].split('=')[0] === 'common') {
								// If matches no need to generate new config
								common = data1[j].split('=')[1];
								if(id[1] === common) {
									common = id[1];
									flag = false;
								}										
							}
						}
				}
			}

			if(flag === true) {
				if(common === '') {
					data1 = contents.toString().split('\n');
					for(j = 0; j < data1.length; j += 1) {
						if(data1[j].split('=')[0] === 'common') {
							common = data1[j].split('=')[1];
						}
					}					
				}				
				name = 'pzp_'+common; //+'_'+getid;
				self.config.filename = name+'_config.txt';
				self.config.keyname = name+'_conn_key.pem';
				self.config.certname = name+'_conn_cert.pem';
				self.config.certnamecsr = name+'_conn_cert.csr';
				self.config.keysize = 1024;
				self.config.mastercertname = name+'_master_cert.pem';
				self.config.masterkeyname = name+'_master_key.pem';
				self.config.masterkeysize = 1024;
			
				data1 = contents.toString().split('\n');
				webinos.session.common.getId(self, function(getid) {
					self.config.id = getid;
					for(i = 0; i < data1.length; i += 1) {
						data1[i] = data1[i].split('=');			
					}
					for(i = 0; i < data1.length; i += 1) {
						if(data1[i][0] === 'country') {
							self.config.country = data1[i][1];
						} else if(data1[i][0] === 'state') {
							self.config.state = data1[i][1];
						} else if(data1[i][0] === 'city') {
							self.config.city = data1[i][1];
						} else if(data1[i][0] === 'organization') {
							self.config.orgname = data1[i][1];
						} else if(data1[i][0] === 'organizationUnit') {
							self.config.orgunit = data1[i][1];
						} else if(data1[i][0] === 'common') {
							self.config.common = data1[i][1] + ':DeviceId@'+self.config.id;
						} else if(data1[i][0] === 'email') {
							self.config.email = data1[i][1];
						} else if(data1[i][0] === 'days') {
							self.config.days = data1[i][1];
						}
					} 
					callback.call(self,'configure pzp');					
				});
			} else if (flag === false) {
				name = 'pzp_'+common;//+'_'+getid;
				self.config.keyname = name+'_conn_key.pem';
			
				self.config.certname = name+'_conn_cert.pem';
				self.config.common = common;
				self.config.mastercertname = name+'_master_cert.pem';
				callback.call(self,'Certificate Present');	
			}		
		});	
	};

	/* starts pzp, creates client, start servers and event listeners
	 * @param server name
	 * @param port: port on which PZH is running
	 */
	webinos.session.pzp.startPZP = function(contents, servername, port, pzpport, ipaddr, callback) {
		var client = new Pzp();
		client.pzh_serverPort = port;
		client.pzh_serverName = servername;
		client.pzp_serverPort = pzpport;
		client.ipaddr = ipaddr;
		client.configurePZP(contents, function(result) {
			webinos.session.common.debug('PZP ('+client.config.sessionId+') '+result);
			client.checkFiles(function(result) {
				webinos.session.common.debug('PZP ('+client.config.sessionId+') Client Connecting ');			
				client.config.sessionId = client.config.common.split(':')[0];
			
				client.connect(result, function(result) {
					if (result === 'connectPZHAgain') {
						var options = {	key: fs.readFileSync(client.config.keyname),
										cert: fs.readFileSync(client.config.certname),
										ca: fs.readFileSync(client.config.mastercertname)};
						client.connect(options, function(result) {
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
	
	webinos.session.pzp.startWebSocketServer = function(hostname, serverPort, webServerPort) {
		var self = this;

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
			webinos.session.common.debug("PZP Web Server: is listening on port "+webServerPort);
		});

		var httpserver = http.createServer(function(request, response) {
			webinos.session.common.debug("PZP Websocket Server: Received request for " + request.url);
			response.writeHead(404);
			response.end();
		});

		httpserver.on('error', function(err) {
			if (err.code === 'EADDRINUSE') {
				serverPort = parseInt(serverPort, 10) +1; 
				httpserver.listen(serverPort, hostname, function(){
					webinos.session.common.debug("PZP Websocket Server: is listening on port "
					+ serverPort +" and hostname " + hostname);
				});
			}
		});

		httpserver.listen(serverPort, hostname, function() {
			webinos.session.common.debug("PZP Websocket Server: Listening on port "+serverPort + 
				" and hostname "+hostname);

		});

		webinos.session.pzp.wsServer = new WebSocketServer({
			httpServer: httpserver,
			autoAcceptConnections: true
		});
		
		
		webinos.session.pzp.connected_session = function(connection) {
			var otherPZP = [], mykey, otherPZH = [];
			webinos.session.pzp.instance.connAppId = webinos.session.pzp.instance.sessionId+ '/'+
			webinos.session.pzp.instance.serviceSessionId;
			webinos.session.pzp.instance.serviceSessionId += 1;
			webinos.session.pzp.instance.connected_app[webinos.session.pzp.instance.connAppId] = connection;

			for(mykey in webinos.session.pzp.instance.connected_pzp) {
				otherPZP.push(webinos.session.pzp.instance.connected_pzp[mykey].name);
			}
	
			for(mykey in webinos.session.pzp.instance.connected_pzh) {
				otherPZH.push(webinos.session.pzp.instance.connected_pzh[mykey].name);
			}
	
			var options = {'type': 'prop', 
				'from': webinos.session.pzp.instance.sessionId, 
				'to': webinos.session.pzp.instance.connAppId,
				'payload': {'status': 'registeredBrowser' , 
					'pzh': webinos.session.pzp.instance.serverName,
					'connected_pzp': otherPZP,
					'connected_pzh': otherPZH
					}
			}
			connection.sendUTF(JSON.stringify(options)); 
		};
		
		webinos.session.pzp.wsServer.on('connect', function(connection) {
			webinos.session.common.debug("PZP Websocket Server: Connection accepted.");
			
			if(webinos.session.pzp.instance !== undefined && webinos.session.pzp.instance !== null) {
				webinos.session.pzp.connected_session(connection);
			}			
			
			connection.on('message', function(message) {
				var pzh;
				var self = this;
				var msg = JSON.parse(message.utf8Data);
				webinos.session.common.debug('PZP Websocket Server: Received packet' + 
					JSON.stringify(msg));

				// Each message is forwarded back to Message Handler to forward rpc message
				if(msg.type === 'prop' && msg.payload.status === 'registerBrowser') {
					var otherPZP = [], mykey;
					var id = webinos.session.pzp.instance.sessionId+ '/'+webinos.session.pzp.instance.serviceSessionId;
					webinos.session.pzp.instance.serviceSessionId += 1;
					webinos.session.pzp.instance.connected_app[id] = connection;
				
					for(mykey in webinos.session.pzp.connected_pzp) {
						otherPZP.push(webinos.session.pzp.instance.connected_pzp[mykey].name);
					}
					var options = {'type': 'prop', 'from': webinos.session.pzp.sessionId, 
						'to': id, 'resp_to': webinos.session.pzp.instance.serverName,
						'payload': {'status': 'registeredBrowser' , 'message': otherPZP}
					};
	
					connection.sendUTF(JSON.stringify(options));
					// Do we need to send all about connected browser
				} else if(msg.type === 'prop' && msg.payload.status === 'startPZH') {
					//fs.writeFile(msg.payload.config.configfile, msg.payload.config.value);
					pzh = webinos.session.pzh.startPZH(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport, 
						function(result) {
							if(result === 'startedPZH') {
								pzh.startHttpsServer(msg.payload.httpserver, msg.payload.servername);
								var info = {"type":"prop", "payload":{"status": "info", "message":"PZH started"}}; 
								connection.sendUTF(JSON.stringify(info));
							}							
						});
				} else if(msg.type === 'prop' && msg.payload.status === 'startPZP') {

					if(webinos.session.pzp.instance !== "null") {
						var otherPZP = [], mykey, otherPZH = [], id;
						webinos.session.pzp.instance = webinos.session.pzp.startPZP(msg.payload.value, 
							msg.payload.servername, 
							msg.payload.serverport, 
							msg.payload.pzpserverport,
							msg.payload.ipaddr,
							function(result) {
								webinos.session.common.debug('PZP WebSocket Server: ' + result);
								webinos.session.pzp.connected_session(connection);
								var info = {"type":"prop", "payload":{"status": "info", "message":"PZP started"}}; 
								connection.sendUTF(JSON.stringify(info));
						});
					}
				} else if(msg.type === 'prop' && msg.payload.status === 'otherPZH') {
					//fs.writeFile(msg.payload.config.configfile, msg.payload.config.value);
					pzh.connectOtherPZH(msg.payload.servername, msg.payload.serverport);
					// Instantiate and connect to other PZH server
				} else if(msg.type === 'prop' && msg.payload.status === 'pzp_info') {
						connection.sendUTF(JSON.stringify(msg));
				} else {
					if( typeof webinos.session.pzp !== "undefined" && 
						webinos.session.pzp !== null) {
						webinos.message.setGet(webinos.session.pzp.instance.sessionId);
						webinos.message.setObject(webinos.session.pzp.instance);
						webinos.message.setSend(webinos.session.pzp.send);
						webinos.message.onMessageReceived(msg, msg.to);
					}
				}
			});
			connection.on('close', function(connection) {
					webinos.session.common.debug("PZP Websocket Server: Peer " +
						connection.remoteAddress + " disconnected.");
			});	
		});
		
	};

	if (typeof exports !== 'undefined') {
 		exports.startPZP = webinos.session.pzp.startPZP;
		exports.startWebSocketServer = webinos.session.pzp.startWebSocketServer;
		exports.send = webinos.session.pzp.send; 
		exports.instance = webinos.session.pzp.instance;
	}

}());
