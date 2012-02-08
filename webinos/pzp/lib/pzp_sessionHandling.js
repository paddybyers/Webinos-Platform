/**
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
* @description It starts Pzp and handle communication with web socket server. Websocket server allows starting Pzh and Pzp via a web browser
*/
(function () {
	"use strict";
	
	var path = require('path');
	var tls  = require('tls');
	var fs   = require('fs');
	
	var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
	var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
	var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
	var webinosDemo  = path.resolve(__dirname, '../../../demo');
		
	if (typeof exports !== "undefined") {
		var rpc            = require(path.join(webinosRoot, dependencies.rpc.location, 'lib/rpc.js'));
		var RPCHandler     = rpc.RPCHandler;
		var MessageHandler = require(path.join(webinosRoot, dependencies.manager.messaging.location, 'lib/messagehandler.js')).MessageHandler;
		var pzp_server     = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/pzp_server.js'));
		var utils          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
		var log            = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
		var configuration  = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));
		var websocket      = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/pzp_websocket.js'));
		var cert           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));

	}
	
	var instance, sessionPzp = []	;
	
	var Pzp = function (modules) {
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
		
		// For a single callback to be registered via addRemoteServiceListener.
		this.serviceListener;
		
		// Handler for remote method calls.
		this.rpcHandler = new RPCHandler(this);
		
		// handler for all things message
		this.messageHandler = new MessageHandler(this.rpcHandler);
		
		// load specified modules
		this.rpcHandler.loadModules(modules);
		this.tried = true;
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
		log('INFO', 'PZP Send to '+ address + ' Message '+JSON.stringify(message));
		
		try {
			if (self.connectedWebApp[address]) { // it should be for the one of the apps connected.
				log('INFO', "PZP (" + self.sessionId +")  Message forwarded to connected app "+address);
				self.connectedWebApp[address].socket.pause();
				self.connectedWebApp[address].sendUTF(JSON.stringify(message));
				process.nextTick(function () {
					self.connectedWebApp[address].socket.resume();
				});
			} else if (self.connectedPzp[address]) {
				log('INFO', "PZP (" + self.sessionId +")  Sending message to Client/Server PZP " +address);
				self.connectedPzp[address].socket.pause();
				self.connectedPzp[address].socket.write(buf);
				process.nextTick(function () {
					self.connectedPzp[address].socket.resume();
				});
			} else if(self.connectedPzh[address]){
				// This is for communicating with PZH
				log('INFO', "PZP (" + self.sessionId +")  Message sending to PZH " + address);
				self.connectedPzh[address].socket.pause();//socket.socket.
				self.connectedPzh[address].socket.write(buf);
				process.nextTick(function () {
					self.connectedPzh[address].socket.resume();
				});
			} 
		} catch (err) {
			log('ERROR', 'PZP (' + self.sessionId + 'Error in sending send message' + err);
		
		}
	};	
	
	sessionPzp.getPzpId = function() {
		if (typeof instance !== "undefined") {
			return instance.sessionId;
		} else { 
			return "virgin_pzp";
		}
	}
	
	sessionPzp.getMessageHandler = function() {
		if (typeof instance !== "undefined") {
			return instance.messageHandler;
		} else {
			return null;
		}
	}
	
	//Added in order to be able to get the rpc handler from the current pzp
	sessionPzp.getPzp = function() {
		if (typeof instance !== "undefined") {
			return instance;
		} else {
			return null;
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
		if (typeof instancsessionPzpe !== "undefined") {
			return instance.connectedPzpIds;
		} else { 
			return [];
		}
	}
	
	Pzp.prototype.authenticated = function(cn, client, callback) {
		var self = this;
		if(!self.connectedPzp.hasOwnProperty(self.sessionId)) {
			log('INFO', 'PZP Connected to PZH & Authenticated');
			self.pzhId = cn;				
			
			self.sessionId = self.pzhId + "/" + self.config.common.split(':')[0];
			rpc.setSessionId(self.sessionId);
		
			self.connectedPzh[self.pzhId] = {socket: client};
			self.connectedPzhIds.push(self.pzhId);
			
			self.connectedPzp[self.sessionId] = {socket: client};
			
			self.pzpAddress = client.socket.address().address;
			self.tlsId[self.sessionId] = client.getSession();
			
			client.socket.setKeepAlive(true, 100);
			
			var msg = self.messageHandler.registerSender(self.sessionId, self.pzhId);
			self.sendMessage(msg, self.pzhId);
			
			pzp_server.startServer(self, function() {
				self.prepMsg(self.sessionId, self.pzhId, 'pzpDetails', self.pzpServerPort);				
				var localServices = self.rpcHandler.getRegisteredServices();
				self.prepMsg(self.sessionId, self.pzhId, 'registerServices', localServices);
				
				log('INFO', 'Sent msg to register local services with pzh');
				callback.call(self, 'startedPZP');
			});
		}
	};
	
	/* It is responsible for connecting with PZH and handling events.
	 * It does JSON parsing of received message
	 * @param config structure used for connecting with Pzh
	 * @param callback is called after connection is useful or fails to inform startPzp
	 */
	Pzp.prototype.connect = function (conn_csr, callback) {
		var self, client, master;
		self = this;
		var conn_key, config = {};
		try{
			var key = require(path.resolve(webinosRoot,dependencies.manager.keystore.location));
			conn_key = key.get(self.config.cert.conn.key_id);
		} catch(err){
			log('ERR0R','[CONFIG] Key fetching error' )
			return;
		}
		try {
			if (typeof self.config.cert.master.cert !== "undefined" && self.config.cert.master.cert !== '{}' ) {
				config = {
					key : conn_key, 
					cert: self.config.cert.conn.cert, 
					ca  : self.config.cert.master.cert,
					crl : self.config.cert.master.crl,
					servername: self.config.uri 
				};
				
			} else {
				config = { key: conn_key, 
					cert: self.config.cert.conn.cert, 
					servername: self.config.uri};					
			}

			console.log(config);
			
			
			//if (self.tried === true) {
				client = tls.connect(configuration.pzhPort, self.address, config,
				function() {
					log('INFO','PZP Connection to PZH status: ' + client.authorized );
					log('INFO','PZP Reusing session : ' + client.isSessionReused());

					if(client.authorized){
						var cn = client.getPeerCertificate().subject.CN.split(':')[1];
						self.authenticated(cn, client, callback);
					} else {
						log('INFO', 'PZP: Not Authenticated ');
						self.pzhId = client.getPeerCertificate().subject.CN.split(':')[1];//data2.from;
						self.connectedPzh[self.pzhId] = {socket: client};
						self.prepMsg(self.sessionId, self.pzhId,
						'clientCert',
							{   csr: conn_csr,
							name: self.config.certValues.common.split(':')[0],
							code: self.code //"DEBUG"
						});
					}
					self.tried = false;
				});
			//} 
		} catch (err) {
			log('ERROR', 'PZP: Connection Exception' + err);
			throw err;
		}
		
		/* It fetches data and forward it to processMsg
		* @param data is the received data
		*/
		client.on('data', function(data) {
			try {
				client.pause(); // This pauses socket, cannot receive messages
				self.processMsg(data, client,callback);
				process.nextTick(function () {
					client.resume();// unlocks socket. 
				});			
			} catch (err) {
				log('ERROR', 'PZP: Exception ' + err);
			
			}			
		});
		
		client.on('end', function () {
			var webApp;			
			var self = this;
			log('INFO', '[PZP] Connection terminated');
			if (typeof self.sessionId !== "undefined") {
				self.messageHandler.removeRoute(self.pzhId, self.sessionId);
			
				delete self.connectedPzh[self.pzhId];
				delete self.connectedPzp[self.sessionId];
			
				self.pzhId     = '';
				self.sessionId = self.config.certValues.common.split(':')[0];

				websocket.updateInstance(instance);

				for ( webApp in self.connectedWebApp ) {
					if (self.connectedWebApp.hasOwnProperty(webApp)) {
						var addr = self.sessionId + '/' + websocket.webId;
						websocket.webId += 1;
						websocket.connectedApp[addr] = self.connectedWebApp[webApp];
						var payload = {type:"prop", from:self.sessionId, to: addr, payload:{status:"registeredBrowser"}};
						websocket.connectedApp[addr].sendUTF(JSON.stringify(payload));
					}
				}
			}			
			// TODO: Try reconnecting back to server but when.
		});

		client.on('error', function (err) {
			log('ERROR', '[PZP - '+self.sessionId+'] Error connecting server' + err);			
		});

		client.on('close', function () {
			log('INFO', '[PZP] Connection closed');
		});
		
	};
	
	Pzp.prototype.processMsg = function(data, client, callback) {
		var self = this;
		var  msg, i ;		
		utils.processedMsg(self, data, 1, function(data2) { // 1 is for #	
			if(data2.type === 'prop' && data2.payload.status === 'signedCert') {
				log('INFO', '[PZP - '+self.sessionId+']PZP Writing certificates data ');
				self.config.cert.conn.cert   = data2.payload.message.clientCert;
				self.config.cert.master.cert = data2.payload.message.masterCert.cert;
				self.config.cert.master.crl = data2.payload.message.masterCert.crl;
				configuration.storeConfig(self.config);
				self.connect(null, function(err){
					console.log(err)
				});
				
			} // This is update message about other connected PZP
			else if(data2.type === 'prop' && data2.payload.status === 'pzpUpdate') {
				log('INFO', '[PZP - '+self.sessionId+'] Update PZPs details') ;
				msg = data2.payload.message;
				for ( i = 0; i < msg.length; i += 1) {
					if(self.sessionId !== msg[i].name) {
						if(!self.connectedPzp.hasOwnProperty(msg[i].name)) {
							self.connectedPzp[msg[i].name] = {'address': msg[i].address, 'port': msg[i].port};
							self.connectedPzpIds.push(msg[i].name);
							// FIXME errors related to connectOtherPZP
//							if(msg[i].newPzp) {
//								self.connectOtherPZP(msg[i]);
//							}
							self.wsServerMsg("Pzp Joined " + msg[i].name);
							self.prepMsg(self.sessionId, self.sessionWebAppId, 'update', {pzp: msg[i].name });		
						}
					}
				}	
			} else if(data2.type === 'prop' && data2.payload.status === 'failedCert') {
				log('ERROR', "Failed to get certificate from PZH");
				callback.call(self, "ERROR");
			    
			} else if(data2.type === 'prop' && data2.payload.status === 'foundServices') {
				log('INFO', '[PZP - '+self.sessionId+'] Received message about available remote services.');
				this.serviceListener && this.serviceListener(data2.payload.message);
				this.serviceListener = undefined;
			}
			// Forward message to message handler
			else {
				rpc.setSessionId(self.sessionId);
				self.messageHandler.onMessageReceived( data2, data2.to);
			}
		});
	};	
	
	/**
	 * Add callback to be used when PZH sends message about other remote
	 * services being available. The callback is cleared once it was called.
	 * @param callback the listener that gets called.
	 */
	Pzp.prototype.addRemoteServiceListener = function(callback) {
		this.serviceListener = callback;
	};
	
	/**
	 * starts pzp, creates client, start servers and event listeners
	 * @param server name
	 * @param port: port on which PZH is running
	 */
	sessionPzp.startPzp = function(url, uri, contents, code, modules, callback) {
		var client      = new Pzp(modules);
		client.modules  = modules;
		client.code     = code;
		
		configuration.setConfiguration(contents, 'Pzp', function (config, conn_key, conn_csr) {
			client.config = config;
			client.config.uri = uri;
			client.sessionId = client.config.certValues.common.split(':')[0];
			utils.resolveIP(url, function(resolvedAddress) {
				log('DEBUG', 'Connecting Address: ' + resolvedAddress);
				client.address = resolvedAddress;
				try {
					client.connect(conn_csr, function(result) {
						if(result === 'startedPZP' ) {
							instance = client;
							websocket.updateInstance(instance);
							if (typeof callback !== "undefined") {
								callback.call(client, 'startedPZP', client);
							}
						}
					});
				} catch (err) {
					callback.call(client, 'failedStarting', client);
					return;
				}
			});
		});
	};	
	
	

	if (typeof exports !== 'undefined') {
		exports.startPzp = sessionPzp.startPzp;
		exports.getPzp = sessionPzp.getPzp;
		exports.getPzpId = sessionPzp.getPzpId;
		exports.getPzhId = sessionPzp.getPzhId;
		exports.getConnectedPzhId = sessionPzp.getConnectedPzpId;
		exports.getConnectedPzpId = sessionPzp.getConnectedPzpId;	
		exports.getMessageHandler = sessionPzp.getMessageHandler;	
	}

}());
