/* It is a client to PZH
 * It runs two servers:
 ** TLS server for allowing other PZP's to connect to it
 ** WebSocket Server to allow websocket connection with the browser
 * It is dependent on session common and messaging
 */
(function () {
	"use strict";
	var sessionPzh = require('../../pzh/lib/session_pzh.js');
	var sessionPzp = {};
	var utils = require('./session_common.js');
	var webinosMessage = require("../../common/manager/messaging/lib/messagehandler.js");

	sessionPzp.send = function (message, address, object) {
		object.sendMessage((message), address);
	};
 
	var tls = require('tls'),
		fs = require('fs'),
		http = require('http'),
		url = require('url'),
		path = require('path'),
		WebSocketServer = require('websocket').server,
		child_process = require('child_process'),
		Pzp = null;

	Pzp = function () {
		// Stores PZH server details
		this.serverName = [];
		// ServiceSessionId for the connected Apps
		this.serviceSessionId = 0;
		//Configuration details
		this.config = {};

		// Stores connected PZP information
		this.connected_pzp = {};
		//Stores particular client socket information
		this.connected_pzh = {};
		// List of connected apps i.e session with browser
		this.connected_app = {};

		this.client_pzp = {};
		
		this.connAppId = null;
		this.instance = null;
		this.lastMsg = '';
	};	

	/* It is responsible for sending message to correct entity. It checks if message is
	 * for Apps connected via WebSocket server. It forwards message to the correct 
	 * WebSocket client or else message is send to PZH
	 * @param message to be sent forward
	 */
	Pzp.prototype.sendMessage = function (message, address) {
		var self = this;
		var buf = new Buffer('#'+JSON.stringify(message)+'#');
		try {
		if (self.connected_app[address]) { // it should be for the one of the apps connected.
			utils.debug("PZP (" + self.config.sessionId +
				")  Message forwarded to connected app ");
			self.connected_app[address].socket.pause();
			self.connected_app[address].sendUTF(JSON.stringify(message));
			process.nextTick(function () {
				self.connected_app[address].socket.resume();
			});
		} else if (self.client_pzp[address]) {
			utils.debug("PZP (" + self.config.sessionId +
				")  Sending message to Server PZP");
			self.client_pzp[address].socket.pause();
			self.client_pzp[address].write(buf);
			process.nextTick(function () {
				self.client_pzp[address].socket.resume();
			});
		} else if (self.connected_pzp[address]) {
			utils.debug("PZP (" + self.config.sessionId +
				")  Sending message to Client PZP ");
			self.connected_pzp[address].socket.socket.pause();
			self.connected_pzp[address].socket.write(buf);
			process.nextTick(function () {
				self.connected_pzp[address].socket.socket.resume();
			});
		} else if (address === self.serverName) {
			// This is for communicating with PZH
			utils.debug("PZP (" + self.config.sessionId +")  Message Addressed to PZH ");
			self.connected_pzh.socket.pause();
			self.connected_pzh.write(buf);
			process.nextTick(function () {
				self.connected_pzh.socket.resume();
			});
		} else {
			utils.debug("PZP (" + self.config.sessionId +") Sending to PZH ");
			self.connected_pzh.socket.pause();
			self.connected_pzh.write(buf);
			process.nextTick(function () {
				self.connected_pzh.socket.resume();
			});
		}
		} catch (err) {
			utils.debug('PZP (' + self.config.sessionId + 
					': Exception' + err);
			utils.debug(err.code);
			utils.debug(err.stack);
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
		fs.readFile(self.config.mastercertname, function (err) {
			if (err) {
				utils.generateSelfSignedCert(self, function (status) {
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

	Pzp.prototype.configurePZP = function(contents, callback) {
		var self = this;
		var id;
		var name, i =0, j;
		var flag = true, common = '', data1;

		fs.readdir(__dirname, function(err, files) {
			for(var i=0; i<files.length; i++) {
				if( (files[i].indexOf('pzp',0) === 0) &&  
				files[i].indexOf('master_cert.pem', 0) !== -1) {
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
				utils.getId(self, function(getid) {
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
							self.config.common = data1[i][1] + 
							':DeviceId:('+self.config.id+')';
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
	
	/* It is responsible for connecting with PZH and handling events.
	 * It does JSON parsing of received message../../RPC/contacts_module/node_contacts_remote/build/config.log
	 */
	Pzp.prototype.connect = function (options, callback) {
		var self, client, msg = {};
		self = this;
		try {
		client = tls.connect(self.pzh_serverPort, 
			self.pzh_serverName, 
			options, 
			function(conn) {
				utils.debug('PZP (' + self.config.sessionId +
					') Connection to PZH status: ' + client.authorized);
				self.connected_pzh = client;
			});
		} catch (err) {
		
		}
		
		client.on('data', function(data) {
			try {
				client.pause();
				self.processMsg(data, callback);
				process.nextTick(function () {
					client.resume();
				});			
			} catch (err) {
				utils.debug('PZP: Exception' + err);
				utils.debug(err.code);
				utils.debug(err.stack);			
			}			
		});
		
		client.on('end', function () {
			utils.debug('PZP ('+self.config.sessionId+') Connection teminated');
		});

		client.on('error', function (err) {
			utils.debug('PZP ('+self.config.sessionId+') Error connecting server' );
			utils.debug(err.stack);
		});

		client.on('close', function () {
			utils.debug('PZP ('+self.config.sessionId+') Connection closed by PZH');
		});
	};
	
	Pzp.prototype.processMsg = function(data, callback) {
		var self = this;
  		if(self.lastMsg !== '') {
			data = self.lastMsg+data;			
			self.lastMsg = '';									
		}
		var  data2 = {}, myKey;
		var data1 = {}, open = 0, i = 0, close = 0;
	
		var msg = data.toString('utf8');//.split('#')
		
		if(msg[0] ==='#' && msg[msg.length-1] === '#') {
			msg = msg.split('#');
			data2 = JSON.parse(msg[1]);
			self.lastMsg ='';
		} else if(msg[0] === '#' || (msg[0] !== '#' && msg[msg.length] !== '#')){
			self.lastMsg += data;
			return;		
		} else if(msg[msg.length-1] === '#'){
			self.lastMsg += data;	
			try{
				data2 = JSON.parse(self.lastMsg);
				self.lastMsg = '';
			} catch(err) {
				utils.debug('PZP ('+self.config.sessionId+') Accumulated data is wrong');
			}
			return;
		}
		
		utils.debug('PZP ('+self.config.sessionId+') Received msg'); 
		/* It sends the client certificate to get signed certificate from server. 
		 * Payload message format {status: 'clientCert', message: certificate)
		 */
		if (data2.type === 'prop' && 
		data2.payload.status === 'NotAuth' /*&& 
		data2.to === self.config.sessionId*/) {
			var common = data2.from + '@' + self.config.common;
			utils.debug('PZP ('+self.config.sessionId+') Not Authenticated');
			var req = 'openssl req -new -subj \"/C='+self.config.country+
			'/ST='+self.config.state+'/L='+self.config.city+'/CN='+common+
			'/emailAddress='+self.config.email + '\" -key ' + self.config.keyname+
			' -out temp.csr';

			child_process.exec(req, function (error, stdout, stderr) {
				self.config.sessionId = common.split(':')[0];
				msg = { 'type': 'prop', 
				'from': self.config.sessionId,
				'payload': {'status':'clientCert', 
					'cert':fs.readFileSync('temp.csr').toString()}};
				self.sendMessage(msg, data2.from);
				
			});
		}
		/* It registers with message handler and set methods for message handler. 
		 * It also registers PZH as its client. To enable message to be sent from 
		 * message handler directly. It is responsible for starting server and 
		 * functionality is similar to PZH, except it does not generate certificates 
		 * for connecting PZP. If port is blocked it increments port before connecting.
		 */
		else if (data2.type === 'prop' && 
			data2.payload.status === 'Auth') {
			utils.debug('PZP ('+self.config.sessionId+') Connected to PZH & Authenticated');
			self.serverName = data2.from;
			self.sessionId = data2.to;

			webinosMessage.setGetOwnId(self.sessionId);
			webinosMessage.setObjectRef(self);
			webinosMessage.setSendMessage(sessionPzp.send);
			msg = webinosMessage.registerSender(self.sessionId, self.serverName);
			self.sendMessage(msg, self.serverName);
			self.startServer(function() {
				msg = { 'type': 'prop', 'from' : self.sessionId, 'to': self.serverName, 
					'payload': {'status': 'pzpDetails', 
					'port': self.pzp_serverPort}};
				self.sendMessage(msg, self.serverName);
				setTimeout(function() {
					callback.call(self, 'startedPZP');
				}, 500);
			});
		} // It is signed client certificate by PZH
		else if(data2.type === 'prop' && 
			data2.payload.status === 'signedCert' /*&& 
			self.config.sessionId === data2.to*/) {
			self.config.sessionId = data2.to;

			utils.debug('PZP ('+self.config.sessionId+') Writing certificates data ' 
				+self.config.certname + ' to ' + data2.to);
			fs.writeFile(self.config.certname, data2.payload.clientCert, 
			function() {
				
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
			utils.debug('PZP ('+self.config.sessionId+') Update PZPs details') ;
			msg = JSON.parse(data2.payload.message);
			for (myKey in msg) {
				if(self.sessionId !== msg[myKey].name && !self.client_pzp[msg[myKey].name]) {
					if(!self.connected_pzp[msg[myKey].name]) {
						self.connected_pzp[msg[myKey].name] = {'socket': '', 
						'name': msg[myKey].name, 
						'address': msg[myKey].address, 
						'port': msg[myKey].port};			

					self.connectOtherPZP(msg[myKey]);
					self.sendMessage({"type":"prop", 
						"payload": {"status":"pzp_info", "message":msg[myKey].name}},
					sessionPzp.instance.connAppId);
					}
				}
			}	
		}
		// Forward message to message handler
		else { 
			utils.debug('PZP ('+self.config.sessionId+') Message Forward to Message Handler' ); 
			webinosMessage.setGetOwnId(self.sessionId);
			webinosMessage.setObjectRef(self);
			webinosMessage.setSendMessage(sessionPzp.send);
			webinos.message.setSeparator("/");
			webinosMessage.onMessageReceived(data2);
		}
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
				utils.debug("PZP Client (" + self.config.sessionId +
					")  Authorized & Connected to PZP: " + msg.address );
				self.client_pzp[msg.name] =  client;
				var msg1 = webinosMessage.registerSender(self.sessionId, msg.name);
				self.sendMessage(msg1, msg.name); 
			} else {
				utils.debug("PZP Client (" + self.config.sessionId +
					")  Cannot connect as we are not connected to PZH ");
			}
		});
	
		client.on('data', function (data) {
			var data1, msg = data.toString('utf8');//.split('#')
			try {
				client.pause();
				if(msg[0] ==='#' && msg[msg.length-1] === '#') {
					msg = msg.split('#');
					data1 = JSON.parse(msg[1]);
					self.lastMsg = '';
				} else if(msg[0] === '#' || 
					(msg[0] !== '#' && msg[msg.length] !== '#')) {
					self.lastMsg += data;
					return;		
				} else if(msg[msg.length-1] === '#') {
					self.lastMsg += data;	
					try{
						data1 = JSON.parse(self.lastMsg);
						self.lastMsg = '';
					} catch(err) {
						utils.debug("PZP Client (" + self.config.sessionId +
						' Accumulated data is wrong');
					}
					return;
				}		
				utils.debug("PZP Client (" + self.config.sessionId +
					")  Message Forward to Message Handler");
				webinosMessage.setGetOwnId(self.sessionId);
				webinosMessage.setObjectRef(self);
				webinosMessage.setSendMessage(sessionPzp.send);
				webinos.message.setSeparator("/");
				webinosMessage.onMessageReceived(data1);

			  	process.nextTick(function () {
					client.resume();
				}); 			
			} catch (err) {
				utils.debug('PZP Client (' + self.config.sessionId + 
					': Exception' + err);
				utils.debug(err.code);
				utils.debug(err.stack);
				
			}
		});

		client.on('end', function () {
			utils.debug("PZP Client (" + self.config.sessionId +
				")  Connection teminated");
		});
	
		client.on('error', function (err) {
			utils.debug("PZP Client (" + self.config.sessionId +
				")  Error connecting server" + err.stack);
			utils.debug(err.code);
			utils.debug(err.stack);	
		});

		client.on('close', function () {
			utils.debug("PZP Client (" + self.config.sessionId +
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
				cn = conn.getPeerCertificate().subject.CN;			
				sessionId = cn.split(':')[0];
				utils.debug("PZP Server (" + self.config.sessionId +
					" Client Authenticated " + sessionId) ;
				
				self.connected_pzp[sessionId] = {'socket': conn, 
								'name': sessionId, 
								'address': conn.socket.remoteAddress, 
								'port': ''};
			} 
				
			conn.on('connection', function () {
				utils.debug("PZP Server (" + self.config.sessionId +
					")  Connection established");
			});
		
			conn.on('data', function (data) {
				try{
				utils.debug("PZP Server (" + self.config.sessionId +
					")  Read bytes = " + data.length);
				var msg = data.toString('utf8');//.split('#')
				if(msg[0] ==='#' && msg[msg.length-1] === '#') {
					msg = msg.split('#');
					parse = JSON.parse(msg[1]);
					self.lastMsg = '';
				} else if(msg[0] === '#' || (msg[0] !== '#' && msg[msg.length] !== '#')){
					self.lastMsg += data;
					return;		
				} else if(msg[msg.length-1] === '#'){
					self.lastMsg += data;	
					try{
						parse = JSON.parse(self.lastMsg);
						self.lastMsg = '';
					} catch(err) {
						utils.debug("PZP Server (" + self.config.sessionId +
							"Accumulated data is wrong");
					}
				}

				if (parse.type === 'prop' && parse.payload.status === 'pzpDetails') {
					if(self.connected_pzp[parse.from]) {
						self.connected_pzp[parse.from].port = parse.payload.port;
					} else {
						utils.debug("PZP Server (" + self.config.sessionId +
						") Received PZP details from entity which is not registered : " + parse.from);
					}
				} else {
					 // Message is forwarded to Message handler function, onMessageReceived
					webinosMessage.setGetOwnId(self.sessionId);
					webinosMessage.setSendMessage(sessionPzp.send);
					webinosMessage.setObjectRef(self);
					webinos.message.setSeparator("/");
					webinosMessage.onMessageReceived(parse);
				}
				} catch(err) {
				utils.debug('PZP Server (' + self.config.sessionId + 
					': Exception' + err);
				utils.debug(err.code);
				utils.debug(err.stack);
				}
			
			});

			conn.on('end', function () {
				utils.debug("PZP Server (" + self.config.sessionId +") connection end");
			});

			// It calls removeClient to remove PZP from connected_client and connected_pzp.
			conn.on('close', function() {
				utils.debug("PZP Server ("+self.config.sessionId+")  socket closed");
			});

			conn.on('error', function(err) {
				utils.debug("PZP Server ("+self.config.sessionId+")"  + err.code);
				utils.debug(err.stack);
			});
		});
	
		server.on('error', function (err) {
			if (err.code === 'EADDRINUSE') {
				utils.debug("PZP Server ("+self.config.sessionId+")  Address in use");
				self.pzp_serverPort = parseInt(self.pzp_serverPort, 10) + 1;
				server.listen(self.pzp_serverPort, self.ipaddr);
			}
		});

		server.on('listening', function () {
			utils.debug("PZP Server ("+self.config.sessionId+")  listening as server on port :" 
						+ self.pzp_serverPort);
			callback.call(self, 'started');
		});				
			
		server.listen(self.pzp_serverPort, self.ipaddr);
	};
	
	/**
	 * Get the session id for this PZP if available.
	 */
	sessionPzp.getSessionId = function() {
		debugger;
		if (typeof sessionPzp.instance !== 'undefined') {
			return sessionPzp.instance.sessionId;
		}
		return undefined;
	};
	
	/* starts pzp, creates client, start servers and event listeners
	 * @param server name
	 * @param port: port on which PZH is running
	 */
	sessionPzp.startPZP = function(contents, servername, port, pzpport, ipaddr, callback) {
		var client = new Pzp();
		client.pzh_serverPort = port;
		client.pzh_serverName = servername;
		client.pzp_serverPort = pzpport;
		client.ipaddr = ipaddr;
		client.configurePZP(contents, function(result) {
			utils.debug('PZP (Not Connected) '+result);
			client.checkFiles(function(result) {
				utils.debug('PZP (Not Connected) Client Connecting ');			
				client.connect(result, function(result) {
					if (result === 'connectPZHAgain') {
						utils.debug('PZP ('+client.config.sessionId+') Client Connecting Again');
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
	
	sessionPzp.startWebSocketServer = function(hostname, serverPort, webServerPort) {
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

		sessionPzp.wsServer = new WebSocketServer({
			httpServer: httpserver,
			autoAcceptConnections: true
		});		
		
		sessionPzp.connected_session = function(connection) {
			var otherPZP = [], mykey, otherPZH = [];
			sessionPzp.instance.connAppId = sessionPzp.instance.sessionId+ '/'+
			sessionPzp.instance.serviceSessionId;
			sessionPzp.instance.serviceSessionId += 1;
			sessionPzp.instance.connected_app[sessionPzp.instance.connAppId] = connection;

			for(mykey in sessionPzp.instance.connected_pzp) {
				otherPZP.push(sessionPzp.instance.connected_pzp[mykey].name);
			}
	
			/*for(mykey in sessionPzp.instance.connected_pzh) {
				otherPZH.push(sessionPzp.instance.connected_pzh[mykey].name);
			}*/
	
			var options = {'type': 'prop', 
				'from': sessionPzp.instance.sessionId, 
				'to': sessionPzp.instance.connAppId,
				'payload': {'status': 'registeredBrowser' , 
					'pzh': sessionPzp.instance.serverName,
					'connected_pzp': otherPZP,
					'connected_pzh': otherPZH
					}
			}
			connection.sendUTF(JSON.stringify(options)); 
		};
		
		sessionPzp.wsServer.on('connect', function(connection) {
			var pzh;
			utils.debug("PZP WSServer: Connection accepted.");
			if(typeof sessionPzp.instance !== "undefined") {
				sessionPzp.connected_session(connection);
			}			
			
			connection.on('message', function(message) {

				var self = this;
				var msg = JSON.parse(message.utf8Data);
				utils.debug('PZP WSServer: Received packet' + JSON.stringify(msg));

				// Each message is forwarded back to Message Handler to forward rpc message
				if(msg.type === 'prop' && msg.payload.status === 'registerBrowser') {
					var otherPZP = [], mykey;
					var id = sessionPzp.instance.sessionId+ '/'+sessionPzp.instance.serviceSessionId;
					sessionPzp.instance.serviceSessionId += 1;
					sessionPzp.instance.connected_app[id] = connection;
				
					for(mykey in sessionPzp.connected_pzp) {
						otherPZP.push(sessionPzp.instance.connected_pzp[mykey].name);
					}
					var options = {'type': 'prop', 'from': sessionPzp.sessionId, 
						'to': id, 'resp_to': sessionPzp.instance.serverName,
						'payload': {'status': 'registeredBrowser' , 'message': otherPZP}
					};
	
					connection.sendUTF(JSON.stringify(options));
					// Do we need to send all about connected browser
				} else if(msg.type === 'prop' && msg.payload.status === 'startPZH') {
					//fs.writeFile(msg.payload.config.configfile, msg.payload.config.value);
					pzh = sessionPzh.startPZH(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport, 
						function(result) {
							if(result === 'startedPZH') {
								//pzh.startHttpsServer(msg.payload.httpserver, msg.payload.servername);
								var info = {"type":"prop", 
								"payload":{"status": "info", "message":"PZH started"}}; 
								connection.sendUTF(JSON.stringify(info));
							}							
						});
				} else if(msg.type === 'prop' && msg.payload.status === 'startPZP') {

					if(sessionPzp.instance !== "null") {
						var otherPZP = [], mykey, otherPZH = [], id;
						sessionPzp.instance = sessionPzp.startPZP(msg.payload.value, 
							msg.payload.servername, 
							msg.payload.serverport, 
							msg.payload.pzpserverport,
							msg.payload.ipaddr,
							function(result) {
								utils.debug('PZP WSServer: ' + result);
								sessionPzp.connected_session(connection);
								var info = {"type":"prop", "payload":{"status": "info", "message":"PZP started"}}; 
								connection.sendUTF(JSON.stringify(info));
						});
					}
				} else if(msg.type === 'prop' && msg.payload.status === 'downloadCert') {
					//fs.writeFile(msg.payload.config.configfile, msg.payload.config.value);
					pzh.downloadCertificate(msg.payload.servername, msg.payload.serverport);
					// Instantiate and connect to other PZH server
				}
				 else if(msg.type === 'prop' && msg.payload.status === 'connectPZH') {
					//fs.writeFile(msg.payload.config.configfile, msg.payload.config.value);
					pzh.connectOtherPZH(msg.payload.servername, msg.payload.serverport);
					// Instantiate and connect to other PZH server
				} else if(msg.type === 'prop' && msg.payload.status === 'pzp_info') {
					connection.sendUTF(JSON.stringify(msg));
				} else {
					if( typeof sessionPzp !== "undefined" && 
						sessionPzp !== null) {
						webinosMessage.setGetOwnId(sessionPzp.instance.sessionId);
						webinosMessage.setObjectRef(sessionPzp.instance);
						webinosMessage.setSendMessage(sessionPzp.send);
						webinos.message.setSeparator("/");
						webinosMessage.onMessageReceived(msg, msg.to);
					}
				}
			});
			connection.on('close', function(connection) {
					utils.debug("PZP WSServer: Peer " +
						connection.remoteAddress + " disconnected.");
			});	
		});
		
	};

	if (typeof exports !== 'undefined') {
 		exports.startPZP = sessionPzp.startPZP;
		exports.startWebSocketServer = sessionPzp.startWebSocketServer;
		exports.send = sessionPzp.send; 
		exports.instance = sessionPzp.instance;
		exports.getSessionId = sessionPzp.getSessionId; 
	}

}());
