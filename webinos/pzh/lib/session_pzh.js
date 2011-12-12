(function() {
	"use strict";
	if (typeof exports !== "undefined") {
		var messaging = require("../../common/manager/messaging/lib/messagehandler.js"),
		utils = require('../../pzp/lib/session_common.js');
	}


	// Global variables and node modules that are required
	var tls = require('tls'),
		fs = require('fs'),
		sessionPzh = {};
	 
	/* connectedPzp: holds information about PZP's connected to current PZH. 
	 * It is an array which store object. An object has two fields:
	 ** session : stores session id of the connected pzp
	 ** socket: Holds socket information which is used while sending message to pzp
	 */

	function Pzh() {
		this.sessionId = 0;
		this.config = {};
		this.connectedPzh = [];
		this.connectedPzp = [];
		this.lastMsg = '';
	};

	Pzh.prototype.prepMsg = function(from, to, status, message) {
		return {'type':'prop', 
			'from':from,
			'to':to,
			'payload':{'status':status, 
				'message':message}};
	};

	/*
	 * Get the session id for this PZP if available.
	 */
	sessionPzh.getSessionId = function() {
		if (typeof sessionPzh.instance !== 'undefined') {
			return sessionPzh.instance.sessionId;
		}
		return undefined;
	};
	/*
	 * This function is registered with message handler to send message towards rpc. 
	 * It searches for correct PZP by looking in connectedPzp. It is searched 
	 * based on message to field. self.connectedPzh
	 * At the moment it uses JSON.stringify to send messages. As we are using objects, 
	 * they need to be stringify to be processed at other end of the socket
	 * @param Message to send forward
	 */
	Pzh.prototype.sendMessage = function(message, address, conn) {
		var buf, self = this;
		try{
			buf = new Buffer('#'+JSON.stringify(message)+'#');
			if (self.connectedPzh[address]) {
				utils.debug(2, 'PZH ('+self.sessionId+') Msg fwd to connected PZH ' + address);
				self.connectedPzh[address].socket.pause();
				self.connectedPzh[address].socket.write(buf);
				process.nextTick(function () {
					self.connectedPzh[address].socket.resume();
				});
			} else if (self.connectedPzp[address]) {
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

	/* configurePZH calls this method
	*  certificate names and other information for generating certificate is  fetched. 
	 * If certificates are not found, they are generated. The functionality of reading 
	 * contents of file and generating certificate is handled in session_common.
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

	Pzh.prototype.connect = function () {
		var i, self = this, server, msg;
		var ca =  [self.config.master.cert.value];
	
		if(typeof self.config.otherPZHMasterCert !== 'undefined'){
		           ca = [self.config.master.cert.value, 
		           	fs.readFileSync(self.config.otherPZHMasterCert)];
		}
	
		// Read server configuration for creating TLS connection
		var options = {key: self.config.conn.key.value,
				cert: self.config.conn.cert.value,
				ca: self.config.master.cert.value,
				requestCert:true, 
				rejectUnauthorized:false,
				};

		// PZH session id is the common name assigned to it. In usual scenaio it should be URL of PZH. 
		self.sessionId = self.config.common.split(':')[0];	
		utils.setMessagingParam(self);
		self.connectedPzh[self.sessionId] = {'address': self.server, 'port': self.port};

		server = tls.createServer (options, function (conn) {
			var data = {}, cn, msg, payload = {}, msg = {}, sessionId;
			self.conn = conn;
		
			/* If connection is authorized:
			* SessionId is generated for PZP. Currently it is PZH's name and 
			* PZP's CommonName and is stored in form of PZH::PZP.
			* registerClient of message manager is called to store PZP as client of PZH
			* Connected_client list is sent to connected PZP. Message sent is with payload 
			* of form {status:'Auth', message:self.connected_client} and type as prop.
	 		*/
	
			if(conn.authorized) {
				cn = conn.getPeerCertificate().subject.CN;
				var data = cn.split(':');
				// Assumption: PZH is of form ipaddr or web url
				// Assumption: PZP is of form url@mobile:Deviceid@mac
				if(data[0] === 'Pzh' ) {
					var pzhId = data[1].split(':')[0];
					var otherPzh = [], myKey;
					utils.debug(2, 'PZH ('+self.sessionId+') PZH '+pzhId+' Connected');
					if(!self.connectedPzh[pzhId]){
						self.connectedPzh[pzhId] = {'socket': conn, 
						'address': conn.socket.remoteAddress, 
						'port': conn.socket.remotePort};
					
						for (myKey in self.connectedPzh)
							otherPzh.push(myKey);
				
						msg = self.prepMsg(self.sessionId, pzhId, 'pzhUpdate', otherPzh);
						self.sendMessage(msg, pzhId);
					
						msg = messaging.registerSender(self.sessionId, pzhId);
						self.sendMessage(msg, pzhId);
					}
				} else if(data[0] === 'Pzp' ) { 
					sessionId = self.sessionId+'/'+data[1].split(':')[0];
					utils.debug(2, 'PZH ('+self.sessionId+') PZP '+sessionId+' Connected');

					if(!self.connectedPzp[sessionId]){
						self.connectedPzp[sessionId] = {'socket': conn, 
						'address': conn.socket.remoteAddress, 
						'port': ''};					
					}
					var msg = messaging.registerSender(self.sessionId, sessionId);
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
				utils.removeClient(self.connectedPzp, conn);
			});

			conn.on('error', function(err) {
				utils.debug(1, 'PZH ('+self.sessionId+')' + err.code );
				utils.debug(1, err.stack);
			});
		});
		return server;
	};

	Pzh.prototype.processMsg = function(conn, data) {
		var self = this, payload = null, myKey;	

		utils.processedMsg(self, data, 1, function(parse) {
		/* Using contents of client certificate, a new certificate is created with issuer
		 * part of the certificate and signing part of the certificate is updated.
		 * Message is sent back to PZP, with its new certificate and server signing certificate. 
		 * Message payload contents status: signedCert and signingCert respectively for client 
		 * certificate and server signing certificate.
		 * PZP connects again to PZH with new certificates.
		 */
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
			if(self.connectedPzp[parse.from]) {
				self.connectedPzp[parse.from].port = parse.payload.message;
				var otherPzp = [], newPzp = false;
				for(mykey in self.connectedPzp) {
					if(mykey === parse.from)
						newPzp = true;
					otherPzp.push({'port': self.connectedPzp[mykey].port, 
						'name':mykey,
						'address':self.connectedPzp[mykey].address,
						'newPzp': newPzp});
				} 
				msg = self.prepMsg(self.sessionId, mykey, 'pzpUpdate', otherPzp);

				for(mykey in self.connectedPzp) 
					self.sendMessage(msg, mykey);
			
			} else {
				utils.debug(2, 'PZH ('+self.sessionId+') Received PZP details from entity' +
				' which is not registered : ' + parse.from);
			}
		} else { // Message is forwarded to Message handler function, onMessageReceived
			utils.sendMessageMessaging(self, parse);
		}
		});	
	};
	/* starts pzh, creates servers and event listeners for listening data from clients.
	 * @param server name
	 * @param port: port on which server is running
	 */
	sessionPzh.startPzh = function(contents, server, port, callback) {
		var __pzh = new Pzh(), sock, msg;
		__pzh.port = port;
		__pzh.server = server;
		utils.configure(__pzh, 'pzh', contents, function(result) {
			__pzh.sessionId = __pzh.config.common.split(':')[0];
			__pzh.checkFiles(function(result) {
				utils.debug(2, 'PZH ('+__pzh.sessionId+') Starting PZH: ' + result);
				__pzh.sock = __pzh.connect();
				__pzh.sock.on('error', function (err) {
					if (err.code == 'EADDRINUSE') {
						utils.debug(2, 'PZH ('+__pzh.sessionId+') Address in use');
						__pzh.port = parseInt(__pzh.port) + 1 ;
						__pzh.sock.listen(__pzh.port, server);
					}
				});

				__pzh.sock.on('listening', function() {
					utils.debug(2, 'PZH ('+__pzh.sessionId+') Listening on PORT ' + __pzh.port);
					callback.call(__pzh, 'startedPzh');
				});
				__pzh.sock.listen(__pzh.port, server);
			});
		});
		return __pzh;
	};

	sessionPzh.startWebSocketServer = function(hostname, serverPort, webServerPort) {
		var self = this, pzh;
		var http = require('http'),
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
			utils.debug(2, 'PZH ('+pzh.config.sessionId+') WebServer: Listening on port '
				+webServerPort);
		});

		var httpserver = http.createServer(function(request, response) {
			request.on('data', function(chunk) {
				if(lastMsg !== '') {
					chunk = lastMsg+chunk;			
					lastMsg = '';									
				}

				var payload = null, parse;

				utils.processedMessage(data, function(parse){
					fs.writeFile('pzh_cert.pem', parse.payload.message, function() {
						//pzh.conn.pair.credentials.context.addCACert(pzh.config.mastercertname);
				   			pzh.conn.pair.credentials.context.addCACert(parse.payload.message);
				   			var payload = pzh.prepMsg(null, null, 'receiveMasterCert',
				   				fs.readFileSync(pzh.config.mastercertname).toString());
						utils.debug(2, 'PZH ('+pzh.config.sessionId+') WSServer:'+ 
							'Server sending certificate '+ JSON.stringify(payload).length);
						response.writeHead(200);		
						response.write('#'+JSON.stringify(payload)+'#\n');
						response.end();
					});
				});

			});
			request.on('end', function(data) {
				utils.debug(2, 'PZH ('+pzh.config.sessionId+') WSServer: Message End');

			});
		});
	
		httpserver.on('error', function(err) {
			if (err.code === 'EADDRINUSE') {
				serverPort = parseInt(serverPort, 10) +1; 
				httpserver.listen(serverPort, hostname);
			}
		});

		httpserver.listen(serverPort, hostname, function() {
			utils.debug(2, 'PZH ('+pzh.sessionId+' WSServer: Listening on port '+serverPort + 
				' and hostname '+hostname);

		});

		sessionPzh.wsServer = new WebSocketServer({
			httpServer: httpserver,
			autoAcceptConnections: true
		});
	
		sessionPzh.wsServer.on('connect', function(connection) {
			utils.debug(2, 'PZH ('+pzh.config.sessionId+' WSServer: Connection accepted.');
			connection.on('message', function(message) {
				var self = this;
				var msg = JSON.parse(message.utf8Data);
				utils.debug(2, 'PZH ('+pzh.config.sessionId+' WSServer: Received packet' + 
					JSON.stringify(msg));
				if(msg.type === 'prop' && msg.payload.status === 'startPZH') {
					pzh = sessionPzh.startPZH(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport, 
						function(result) {
							if(result === 'startedPzh') {
								var info = {"type":"prop", 
								"payload":{"status": "info", 
								"message":"PZH started"}}; 
								connection.sendUTF(JSON.stringify(info));
							}							
						});
				} else if(msg.type === "prop" && msg.payload.status === 'downloadCert') {
					pzh.downloadCertificate(msg.payload.servername,	msg.payload.serverport);				
				}
			});
		});

	};

	Pzh.prototype.downloadCertificate = function(servername, port) {
		var self = this;
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
				if(lastMsg !== '') {
					data = lastMsg+data;			
					lastMsg = '';									
				}
				utils.processedMsg(data, 2, function(parse) {	
					fs.writeFile('pzh_cert.pem', 
					parse.payload.message, function() {
						self.connectOtherPZH(servername, '443');
					});
				});
			});			
		});
		msg = self.prepMsg(null,null,'getMasterCert', 
			fs.readFileSync(self.config.mastercertname).toString());
		req.write('#'+JSON.stringify(msg)+'#\n');
		req.end();
	}

	//sessionPzh.connectOtherPZH = function(server, port) {
	Pzh.prototype.connectOtherPZH = function(server, port) {
		var self = this;
		utils.debug(2, 'PZH ('+self.sessionId+') Connect Other PZH');
		var options = {	key: fs.readFileSync(self.config.conn.key.name),
				cert: fs.readFileSync(self.config.conn.cert.name),
				ca: [fs.readFileSync(self.config.master.cert.name), 
				fs.readFileSync('pzh_cert.pem')]}; 
			
		var connPzh = tls.connect(port, server, options, function(conn) {
			utils.debug(2, 'PZH ('+self.sessionId+') Connection Status : '+connPzh.authorized);
			if(connPzh.authorized) {
				utils.debug(2, 'PZH ('+self.sessionId+') Connected ');
				var connPzhId = connPzh.getPeerCertificate().subject.CN.split(':')[1];
				self.connectedPzh[connPzhId] = {socket : connPzh};
				var msg = messaging.registerSender(self.sessionId, connPzhId);			
				self.sendMessage(msg, connPzhId);

			} else {
				utils.debug(2, 'PZH ('+self.sessionId+') Not connected');
			}
		
			connPzh.on('data', function(data) {
				utils.processedMsg(data, 1, function(parse){			
					utils.sendMessageMessaging(parse);				
				});				
			});

			connPzh.on('error', function() {
				utils.debug(2, 'PZH ('+self.sessionId+')' + err.code );
				utils.debug(err.stack);
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
		exports.startWebSocketServer = sessionPzh.startWebSocketServer;
	}

}())
