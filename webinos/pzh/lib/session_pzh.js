/**
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
* @description It starts Pzh and handle communication with messaging manager. It has a websocket server embedded to allow starting Pzh via web browser
*/
(function() {
	"use strict";
	if(typeof webinos === "undefined") {
		var webinos = {};
	}

	// Global variables and node modules that are required
	var tls = require('tls'),
		fs = require('fs'),
		Pzh = null,
		sessionPzh = [],
		instance;
		
	if (typeof exports !== "undefined") {
		var rpc = require("../../common/rpc/lib/rpc.js");
		var rpcHandler = new RPCHandler();
		rpc.loadModules(rpcHandler);
		var messaging = require("../../common/manager/messaging/lib/messagehandler.js");
		messaging.setRPCHandler(rpcHandler);
		var utils = require('../../pzp/lib/session_common.js');
		var path = require('path');
	}
	
	/**
	 * @description Creates a new Pzh object
	 * @constructor
	 */
	Pzh = function () {
		this.sessionId = 0;
		this.config = {};
		this.connectedPzh = [];
		this.connectedPzp = [];
		this.connectedPzhIds = [];
		this.connectedPzpIds = [];
		this.lastMsg = '';
	};
	/**
	 * @description A generic function used to set message parameter
	 * @param {String} from Source address
	 * @param {String} to Destination address
	 * @param {String} status This is a message type, different types are used as per message 
	 * @param {String|Object} message This could be a string or an object
	 * @returns {Object} Message to be sent 
	 */
	Pzh.prototype.prepMsg = function(from, to, status, message) {
		return {'type': 'prop', 
			'from': from,
			'to': to,
			'payload':{'status':status, 'message':message}};
	};

	/**
	 * @description It searches for correct PZP by looking in connectedPzp and connectedPzh. As we are using objects, they need to be stringify to be processed at other end of the socket
	 * @param {Object} message Message to be send forward
	 * @param {String} address Destination session id
	 * @param {Object} conn This is used in special cases, especially when Pzh and Pzp are not connected. 
	 */
	Pzh.prototype.sendMessage = function(message, address, conn) {
		var buf, self = this;
		try{
			buf = new Buffer('#'+JSON.stringify(message)+'#');
			if (self.connectedPzh.hasOwnProperty(address)) {
				utils.debug(2, 'PZH ('+self.sessionId+') Msg fwd to connected PZH ' + address);
				self.connectedPzh[address].socket.pause();
				self.connectedPzh[address].socket.write(buf);
				process.nextTick(function () {
					self.connectedPzh[address].socket.resume();
				});
			} else if (self.connectedPzp.hasOwnProperty(address)) {
				self.connectedPzp[address].socket.pause();
				utils.debug(2, 'PZH ('+self.sessionId+') Msg fwd to connected PZP ' + address);
				self.connectedPzp[address].socket.write(buf);
				process.nextTick(function () {
					self.connectedPzp[address].socket.resume();
				});
			} else if( typeof conn !== "undefined" ) {
				conn.pause();
				conn.write(buf);
				process.nextTick(function () {
					conn.resume();
				});
			} else {
				utils.debug(2, "PZH: Client " + address + " is not connected");
			} 
		} catch(err) {
			utils.debug(1,'PZH ('+self.sessionId+') Exception' + err);
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
		}
	};

	/** 
	* @descripton Checks for master certificate, if certificate is not found it calls generating certificate function defined in certificate manager. This function is crypto sensitive. 
	* @param {function} callback It is callback function that is invoked after checking/creating certificates
	*/
	Pzh.prototype.checkFiles = function (callback) {
		var self = this;
		fs.readFile(self.config.master.cert.name, function(err) {
		if(err !== null && err.code === 'ENOENT') {			
			utils.selfSigned(self, 'Pzh', self.config.conn, function(status) {
				if(status === 'certGenerated') {
					utils.debug(2, 'PZH Generating Certificates');
					fs.writeFileSync(self.config.conn.key.name, self.config.conn.key.value);
					utils.selfSigned(self, 'Pzh:Master', self.config.master, function(result) {
						if(result === 'certGenerated') {
							fs.writeFileSync(self.config.master.key.name, self.config.master.key.value);
							fs.writeFileSync(self.config.master.cert.name, self.config.master.cert.value);
							utils.signRequest(self, self.config.conn.csr.value, self.config.master,
							function(result, cert) {
								if(result === 'certSigned'){ 
									self.config.conn.cert.value = cert;
									fs.writeFileSync(self.config.conn.cert.name, cert);
									callback.call(self, 'Certificates Created');
								}
							});
						}
					});
				}				
			});
		} else {
			self.config.master.cert.value = fs.readFileSync(self.config.master.cert.name).toString(); 
			self.config.master.key.value = fs.readFileSync(self.config.master.key.name).toString();
			self.config.conn.cert.value = fs.readFileSync(self.config.conn.cert.name).toString(); 
			self.config.conn.key.value = fs.readFileSync(self.config.conn.key.name).toString();
			callback.call(self, 'Certificates Present');
		}		
		});	
	};
	
	/**
	* @description Starts Pzh server. It creates server configuration and then createsServer 
	*/
	Pzh.prototype.connect = function () {
		var self = this, server;
		
		var ca =  [self.config.master.cert.value];	
		if(typeof self.config.otherPZHMasterCert !== 'undefined') {
		           ca = [self.config.master.cert.value, fs.readFileSync(self.config.otherPZHMasterCert)];
		}
	
		/** @param {Object} options Creates options parameter, key, cert and ca are set */
		var options = {key: self.config.conn.key.value,
				cert: self.config.conn.cert.value,
				ca: self.config.master.cert.value,
				requestCert:true, 
				rejectUnauthorized:false
				};

		/** Sets messaging parameter */
		utils.setMessagingParam(self);
		/** @param {Object} connectedPzh holds connected Pzh information
		* @param connectedPzh.address stores information about IP address
		* @param connectedPzh.port stores port on which external Pzh is running
		*/
		/*if(!self.connectedPzh.hasOwnProperty(self.sessionId)) {
			self.connectedPzh[self.sessionId] = {'address': self.server, 'port': self.port};
		}*/
		
		server = tls.createServer (options, function (conn) {
			var data = {}, cn, msg = {}, sessionId;
			self.conn = conn;


			if(conn.authorized) {
				cn = conn.getPeerCertificate().subject.CN;
				data = cn.split(':');
				// Assumption: PZH is of form ipaddr or web url
				// Assumption: PZP is of form url@mobile:Deviceid@mac
				if(data[0] === 'Pzh' ) {
					var pzhId = data[1].split(':')[0];
					var otherPzh = [], myKey;
					utils.debug(2, 'PZH ('+self.sessionId+') PZH '+pzhId+' Connected');
					if(!self.connectedPzh.hasOwnProperty(pzhId)){
						self.connectedPzh[pzhId] = {'socket': conn, 
						'address': conn.socket.remoteAddress, 
						'port': conn.socket.remotePort};
					
						self.connectedPzhIds.push(pzhId);
				
						msg = self.prepMsg(self.sessionId, pzhId, 'pzhUpdate', self.connectedPzhIds);
						self.sendMessage(msg, pzhId);
					
						msg = messaging.registerSender(self.sessionId, pzhId);
						self.sendMessage(msg, pzhId);
					}
				} else if(data[0] === 'Pzp' ) { 
					sessionId = self.sessionId+'/'+data[1].split(':')[0];
					utils.debug(2, 'PZH ('+self.sessionId+') PZP '+sessionId+' Connected');

					if(!self.connectedPzp.hasOwnProperty(sessionId)){
						self.connectedPzpIds.push(sessionId);
						self.connectedPzp[sessionId] = {'socket': conn, 
						'address': conn.socket.remoteAddress, 
						'port': ''};					
					}
					msg = messaging.registerSender(self.sessionId, sessionId);
					self.sendMessage(msg, sessionId);//
				}
			}
	
			conn.on('data', function(data) {
				try {
					conn.pause();
					self.processMsg(conn, data);
					process.nextTick(function () {
						conn.resume();
					});
				} catch (err) {
					utils.debug(1, 'PZH ('+self.sessionId+') Exception' + err);
					utils.debug(1, err.code);
					utils.debug(1, err.stack);
				
				}
			});
		
			conn.on('end', function() {
				utils.debug(2, 'PZH ('+self.sessionId+') Server connection end');
			});		

			// It calls removeClient to remove PZP from connected_client and connectedPzp.
			conn.on('close', function() {
				utils.debug(2, 'PZH ('+self.sessionId+') Remote Socket  closed');
				var removed = utils.removeClient(self, conn);
				messaging.removeRoute(removed, self.sessionId);
			});

			conn.on('error', function(err) {
				utils.debug(1, 'PZH ('+self.sessionId+')' + err.code );
				utils.debug(1, err.stack);
			});
		});
		return server;
	};
	
	/** @description This is a crypto sensitive function
	*/
	Pzh.prototype.processMsg = function(conn, data) {
		var self = this;	
		utils.processedMsg(self, data, 1, function(parse) {		
			if(parse.type === 'prop' && parse.payload.status === 'clientCert' ) {
				utils.signRequest(self, parse.payload.message, self.config.master, 
				function(result, cert) {
					if(result === "certSigned") {
						var payload = {'clientCert': cert,
							'masterCert':self.config.master.cert.value};
						var msg = self.prepMsg(self.sessionId, null, 'signedCert', payload);
						self.sendMessage(msg, null, conn);
					}
				});
			} else if (parse.type === 'prop' && parse.payload.status === 'pzpDetails') {
				if(self.connectedPzp.hasOwnProperty(parse.from)) {
					self.connectedPzp[parse.from].port = parse.payload.message;
					var otherPzp = [], newPzp = false, myKey1, myKey2, msg;
					for( myKey1 in self.connectedPzp) {
						if(self.connectedPzp.hasOwnProperty(myKey1)) {
						if(myKey1 === parse.from) {
							newPzp = true;
						}
						
						otherPzp.push({'port': self.connectedPzp[myKey1].port,
							'name': myKey1,
							'address': self.connectedPzp[myKey1].address,
							'newPzp': true});
						}
					}

					for( myKey2 in self.connectedPzp) {
						if(self.connectedPzp.hasOwnProperty(myKey2)) {
							msg = self.prepMsg(self.sessionId, myKey2, 'pzpUpdate', otherPzp);
							self.sendMessage(msg, myKey2);
						}					
					}

				} else {
					utils.debug(2, 'PZH ('+self.sessionId+') Received PZP details from entity' +
					' which is not registered : ' + parse.from);
				}
			} else { // Message is forwarded to Message handler function, onMessageReceived
				rpc.SetSessionId(self.sessionId);
				utils.sendMessageMessaging(self, parse);
			}
		});	
	};
	
	
	/* starts pzh, creates servers and event listeners for listening data from clients.
	 * @param server name
	 * @param port: port on which server is running
	 */
	sessionPzh.startPzh = function(contents, server, port, callback) {
		var pzh = new Pzh();
		instance = pzh;
		pzh.port = port;
		pzh.server = server;
		utils.configure(pzh, 'pzh', contents, function() {
			pzh.sessionId = pzh.config.common.split(':')[0];
			sessionPzh.push({ 'id': pzh.sessionId, 'connectedPzh': pzh.connectedPzhIds, 
			'connectedPzp': pzh.connectedPzpIds });
			pzh.checkFiles(function(result) {
				utils.debug(2, 'PZH ('+pzh.sessionId+') Starting PZH: ' + result);
				pzh.sock = pzh.connect();
				
				pzh.sock.on('error', function (err) {
					if (err !==  null && err.code === 'EADDRINUSE') {
						utils.debug(2, 'PZH ('+pzh.sessionId+') Address in use');
						pzh.port = parseInt(pzh.port, 10) + 1 ;
						pzh.sock.listen(pzh.port, server);
					}
				});

				pzh.sock.on('listening', function() {
					utils.debug(2, 'PZH ('+pzh.sessionId+') Listening on PORT ' + pzh.port);
					if(typeof callback !== 'undefined')
						callback.call(pzh, 'startedPzh');
				});
				utils.resolveIP(server, function(name) {
					server = name;
					pzh.sock.listen(pzh.port, server);
				});
				
			});
		});
		return pzh;
	};

	sessionPzh.startPzhWebSocketServer = function(hostname, serverPort, webServerPort) {
		var http = require('http'),
		url = require('url'),
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
			utils.debug(2, 'PZH WebServer: Listening on port ' +webServerPort);
		});

		var httpserver = http.createServer(function(request, response) {
			request.on('data', function(chunk) {
				utils.processedMessage(chunk, function(parse){
					fs.writeFile(pzh.config.otherPzh, parse.payload.message, function() {
						//pzh.conn.pair.credentials.context.addCACert(pzh.config.mastercertname);
						pzh.conn.pair.credentials.context.addCACert(parse.payload.message);
						var payload = pzh.prepMsg(null, null, 'receiveMasterCert', pzh.config.master.cert.value);
						utils.debug(2, 'PZH  WSServer: Server sending certificate '+ JSON.stringify(payload).length);
						response.writeHead(200);		
						response.write('#'+JSON.stringify(payload)+'#\n');
						response.end();
					});
				});

			});
			request.on('end', function() {
				utils.debug(2, 'PZH WSServer: Message End');

			});
		});
	
		httpserver.on('error', function(err) {
			if (err.code === 'EADDRINUSE') {
				serverPort = parseInt(serverPort, 10) +1; 
				httpserver.listen(serverPort, hostname);
			}
		});

		httpserver.listen(serverPort, hostname, function() {
			utils.debug(2, 'PZH WSServer: Listening on port '+serverPort + ' and hostname '+hostname);

		});

		var wsServer = new WebSocketServer({
			httpServer: httpserver,
			autoAcceptConnections: true
		});
	
		wsServer.on('connect', function(connection) {
			utils.debug(2, 'PZH WSServer: Connection accepted.');
			connection.on('message', function(message) {
				// schema validation
				//var msg = utils.checkSchema(message.utf8Data);
				var msg = JSON.parse(message.utf8Data);
				utils.debug(2, 'PZH WSServer: Received packet' + JSON.stringify(msg));
				if(msg.type === 'prop' && msg.payload.status === 'startPzh') {
					instance = sessionPzh.startPzh(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport, 
						function(result) {
							if(result === 'startedPzh') {
								var info = {"type":"prop", 
								"payload":{"status": "info", 
								"message":"PZH "+instance.sessionId+" started"}}; 
								connection.sendUTF(JSON.stringify(info));
							}				
						});
				} else if(msg.type === "prop" && msg.payload.status === 'downloadCert') {
					instance.downloadCertificate(msg.payload.servername, msg.payload.serverport);				
				}
			});
		});

	};

	Pzh.prototype.downloadCertificate = function(servername, port) {
		var self = this;
		var http = require('http');
		var agent = new http.Agent({maxSockets: 1});
		var headers = {'connection': 'keep-alive'};

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
					fs.writeFile('pzh_cert.pem', 
					parse.payload.message, function() {
						self.connectOtherPZH(servername, '443');
					});
				});
			});			
		});
		var msg = self.prepMsg(null,null,'getMasterCert', 
			fs.readFileSync(self.config.mastercertname).toString());
		req.write('#'+JSON.stringify(msg)+'#\n');
		req.end();
	};

	//sessionPzh.connectOtherPZH = function(server, port) {
	Pzh.prototype.connectOtherPZH = function(server, port) {
		var self = this;
		utils.debug(2, 'PZH ('+self.sessionId+') Connect Other PZH');
		var options = {	key: fs.readFileSync(self.config.conn.key.name),
				cert: fs.readFileSync(self.config.conn.cert.name),
				ca: [fs.readFileSync(self.config.master.cert.name), 
				fs.readFileSync('pzh_cert.pem')]}; 
			
		var connPzh = tls.connect(port, server, options, function() {
			utils.debug(2, 'PZH ('+self.sessionId+') Connection Status : '+connPzh.authorized);
			if(connPzh.authorized) {
				utils.debug(2, 'PZH ('+self.sessionId+') Connected ');
				var connPzhId = connPzh.getPeerCertificate().subject.CN.split(':')[1];
				if(self.connectedPzh.hasOwnProperty(connPzhId)) {
					self.connectedPzh[connPzhId] = {socket : connPzh};
					var msg = messaging.registerSender(self.sessionId, connPzhId);			
					self.sendMessage(msg, connPzhId);
				}

			} else {
				utils.debug(2, 'PZH ('+self.sessionId+') Not connected');
			}
		
			connPzh.on('data', function(data) {
				utils.processedMsg(data, 1, function(parse){
					rpc.SetSessionId(self.sessionId);
					utils.sendMessageMessaging(parse);				
				});				
			});

			connPzh.on('error', function(err) {
				utils.debug(2, 'PZH ('+self.sessionId+')' + err.code );
			});

			connPzh.on('close', function() {
				utils.debug(2, 'close');
			});

			connPzh.on('end', function() {
				utils.debug(2, 'Pzh End');
			});

		});
	};
	
	if (typeof exports !== 'undefined') {
		exports.startPzh = sessionPzh.startPzh;
		exports.startPzhWebSocketServer = sessionPzh.startPzhWebSocketServer;
		exports.getId = sessionPzh.getId;
		
	}
}());
