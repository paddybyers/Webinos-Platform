/**
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
* @description session_pzh.js starts Pzh and handle communication with a messaging manager. It is also responsible for loading rpc modules. 
*/
(function() {
	"use strict";

	/** Node modules used by Pzh */
	var tls = require('tls'),
	fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	util = require('util');
	
	var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
	var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
	var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
	var webinosDemo  = path.resolve(__dirname, '../../../demo');
	
	/** Global variables used in Pzh */
	var Pzh        = null;
	var log        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
	var pzhapis    = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_internal_apis.js'));
	var config     = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));
	var farm       = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_farm.js'));
	
	var server = null;
	var initialized = true;
	var pzhs = [];
	
	if (typeof exports !== 'undefined') {
		try {
			var rpc       = require(path.join(webinosRoot, dependencies.rpc.location));
			var authcode  = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_authcode.js'));
			var cert      = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
			var utils     = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));

			var MessageHandler = require(path.join(webinosRoot, dependencies.manager.messaging.location, 'lib/messagehandler.js')).MessageHandler;
			var RPCHandler = rpc.RPCHandler;
		} catch (err) {
			log('ERROR ', "Webinos modules missing, please check webinos installation" + err);
			return;
		}
	}
	
	/**
	 * @description Creates a new Pzh object
	 * @constructor
	 */
	Pzh = function (modules) {
		/** Holds PZH Session Id */
		this.sessionId = 0;
		/** Holds PZH Configuration i.e. file names and certificate configuration */
		this.config = {};
		/** Holds Connected PZH, holds information about IP address, port and socket */
		this.connectedPzh = [];
		/** Holds connecting PZP information, it holds information about their IP address and socket connection */
		this.connectedPzp = [];
		/** This is used for synchronization purpose with connected PZP and PZH */	
		this.connectedPzhIds = [];
		/** This is used for synchronization purpose with connected PZP and PZH */	
		this.connectedPzpIds = [];
		// Handler for remote method calls.
		this.rpcHandler = new RPCHandler();
		// handler of all things message
		this.messageHandler = new MessageHandler(this.rpcHandler);
		// load specified modules
		this.rpcHandler.loadModules(modules);
		/* This is used for authenticating new PZPs */
		var self = this;
		authcode.createAuthCounter(function(res) {
		    self.expecting = res;
		});
	}
	
	/**
	 * @description A generic function used to set message parameter
	 * @param {String} from Source address
	 * @param {String} to Destination address
	 * @param {String} status This is a message type, different types are used as per message 
	 * @param {String|Object} message This could be a string or an object
	 * @returns {Object} Message to be sent 
	 */
	Pzh.prototype.prepMsg = function(from, to, status, message) {
		var msg = null;
		if ( from === null || to === null || status === null || message === null )  {
			log('INFO', "Prep message failed");
		} else {
			msg = {'type': 'prop', 
			'from': from,
			'to': to,
			'payload':{'status':status, 'message':message}};
		}
		return msg;
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
			/** TODO: This is a temporary solution to append message with #. This is done in order to identify whole message at receiving end */
			buf = new Buffer('#'+JSON.stringify(message)+'#');
			if (self.connectedPzh.hasOwnProperty(address)) {
				log('INFO', 'PZH ('+self.sessionId+') Msg fwd to connected PZH ' + address);
				self.connectedPzh[address].socket.pause();
				self.connectedPzh[address].socket.write(buf);
				process.nextTick(function () {
					self.connectedPzh[address].socket.resume();
				});
			} else if (self.connectedPzp.hasOwnProperty(address)) {
				self.connectedPzp[address].socket.pause();
				log('INFO', 'PZH ('+self.sessionId+') Msg fwd to connected PZP ' + address);
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
				log('INFO', "PZH: Client " + address + " is not connected");
			} 
		} catch(err) {
			log('ERROR ', "Exception in sending packet " + err);
			
		}
	};
	
	
	Pzh.prototype.handleConnectionAuthorization = function(self, conn) {
		if(conn.authorized === false) {
			log('INFO', "Connection NOT authorised at PZH " );
			
			//Sometimes, if this is a new PZP, we have to allow it.
			self.expecting.isExpected(function(expected) {
			
				if (!expected || conn.authorizationError !== "UNABLE_TO_GET_CRL"){
					//we're not expecting anything - disallow.
					log('INFO', "Ending connect: " + conn.authorizationError);
					conn.socket.end();
				} else {
					log('INFO',"Continuing connect - expected: " + conn.authorizationError);
				}
			});
		}
		if(conn.authorized) {
			var cn, data;
			log('INFO', "Connection authorised at PZH");
			try {
				cn = conn.getPeerCertificate().subject.CN;
				data = cn.split(':');
			} catch(err) {
				log('ERROR ','PZH ('+self.sessionId+') Exception in reading common name of peer certificate ' + err);
				return;
			}

			// Assumption: PZH is of form ipaddr or web url
			// Assumption: PZP is of form url@mobile:Deviceid@mac
			if(data[0] === 'Pzh' ) {
				var  pzhId, otherPzh = [], myKey;
				try {
					pzhId = data[1].split(':')[0];
				} catch (err1) {
					log('ERROR ','PZH ('+self.sessionId+') Pzh information in certificate is in unrecognized format ' + err);
					return;
				}

				log('INFO', 'PZH ('+self.sessionId+') PZH '+pzhId+' Connected');
				if(!self.connectedPzh.hasOwnProperty(pzhId)) {
					self.connectedPzh[pzhId] = {'socket': conn,
					'address': conn.socket.remoteAddress,
					'port': conn.socket.remotePort};
					self.connectedPzhIds.push(pzhId);

					msg = self.prepMsg(self.sessionId, pzhId, 'pzhUpdate', self.connectedPzhIds);
					self.sendMessage(msg, pzhId);

					msg = self.messageHandler.registerSender(self.sessionId, pzhId);
					self.sendMessage(msg, pzhId);
				}
			} else if(data[0] === 'Pzp' ) {
				var sessionId = self.sessionId+'/'+data[1].split(':')[0];pzhs
				log('INFO', 'PZH ('+self.sessionId+') PZP '+sessionId+' Connected');
				if(!self.connectedPzp.hasOwnProperty(sessionId)) {
					self.connectedPzpIds.push(sessionId);
					self.connectedPzp[sessionId] = {'socket': conn,
							'address': conn.socket.remoteAddress,
							'port': ''};
				}
				var msg = self.messageHandler.registerSender(self.sessionId, sessionId);
				self.sendMessage(msg, sessionId);//
			}
		}
	};

	Pzh.prototype.handleData = function(conn, data) {
		try {
			conn.pause();
			this.processMsg(conn, data);
			process.nextTick(function () {
				conn.resume();
			});
		} catch (err) {
			log('ERROR ', 'PZH ('+self.sessionId+') Exception in processing recieved message ' + err);
		}
	}
	
	Pzh.prototype.getMyUrl = function(cb) {
    	//TODO: Find out where the Pzh URL would be stored.  Config?
	     cb.call(this, config.servername );
	}	
	
	Pzh.prototype.addNewPZPCert = function (parse, cb) {
		"use strict";
		var self = this;
		try {
			self.expecting.isExpectedCode(parse.payload.message.code, function(expected) {
				if (expected) {
					cert.signRequest(self, parse.payload.message.csr, self.config.master, 2, function(result, cert) {
						if(result === "certSigned") {
							self.expecting.unsetExpected(function() {
								//Save this certificate locally on the PZH.
								//pzp name: parse.payload.message.name
								fs.writeFileSync(self.config.pzhSignedCertDir+'/'+ parse.payload.message.name + ".pem", cert);
								var payload = {'clientCert': cert, 'masterCert':self.config.master.cert.value};
								var msg = self.prepMsg(self.sessionId, null, 'signedCert', payload);
								cb(null, msg);
							});
						} else {
							log('ERROR ', 'PZH ('+self.sessionId+') Error Signing Client Certificate');
							cb.call("Could not create client certificate - " + result, null);
						}
					});
				} else {
					var payload = {};
					var msg = self.prepMsg(self.sessionId, null, 'failedCert', payload);
					log('INFO', "Failed to create client certificate: not expected");
					cb.call(null, msg);
				}
			});pzhs
		} catch (err) {
			log('ERROR ', 'PZH ('+self.sessionId+') Error Signing Client Certificate' + err);
			cb("Could not create client certificate", null);
		}
	}	
	
	/** @description This is a crypto sensitive function
	*/
	Pzh.prototype.processMsg = function(conn, data) {
		var self = this;
		utils.processedMsg(self, data, 1, function(parse) {		
			if(parse.type === 'prop' && parse.payload.status === 'clientCert' ) {
				self.addNewPZPCert(parse, function(err, msg) {
					if (err !== null) {
						log('INFO', err);
						return;
					} else {
						self.sendMessage(msg,null,conn)
					}
				});
				
			} else if (parse.type === 'prop' && parse.payload.status === 'pzpDetails') {
				try {
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
						log('ERROR ', 'PZH ('+self.sessionId+') Received PZP details from not registered device' + parse.from);
					}
				} catch (err1) {
					log('ERROR ', 'PZH ('+self.sessionId+') Error Updating Pzh/Pzp' + err1);
					return;
				}				
			} else if(parse.type === "prop" && parse.payload.status === 'registerServices') {
				log('INFO', 'Receiving Webinos Services from PZP...');
				var pzpServices = parse.payload.message;
				self.rpcHandler.addRemoteServiceObjects(pzpServices);
			} else if(parse.type === "prop" && parse.payload.status === 'findServices') {
				log('INFO', 'Trying to send Webinos Services from this RPC handler to ' + parse.from + '...');
				var services = self.rpcHandler.getAllServices(parse.from);
				var msg = self.prepMsg(self.sessionId, parse.from, 'foundServices', services);
				self.sendMessage(msg, parse.from, conn);
				log('INFO', 'Sent ' + (services && services.length) || 0 + ' Webinos Services from this RPC handler.');
			} else { // Message is forwarded to Message handler function, onMessageReceived
				try {			
					rpc.setSessionId(self.sessionId);
					self.messageHandler.onMessageReceived(parse, parse.to);
				} catch (err2) {
					log('ERROR ', 'Error Setting RPC Session Id/Message Sending to Messaging ' + err2);
					return;
				}
			}
		});	
	};

	var send = function (message, address, object) {
		"use strict";
		object.sendMessage(message, address);
	};
	
	exports.addPzh = function ( uri, contents, modules, callback) {
		var pzh = new Pzh(modules);
		config.setConfiguration(contents, 'Pzh', function(config, conn_key) {
			pzh.config    = config;
			pzh.sessionId = pzh.config.certValues.common.split(':')[0];
			
			farm.pzhs[uri] = pzh;
			
			var options = {key: conn_key,
				cert: config.cert.conn.cert,
				ca: config.cert.master.cert,
				crl: config.cert.master.crl,
				requestCert:true, 
				rejectUnauthorized:false
			};

			pzh.messageHandler.setGetOwnId(pzh.sessionId);
			pzh.messageHandler.setObjectRef(pzh);
			pzh.messageHandler.setSendMessage(send);
			pzh.messageHandler.setSeparator("/");
			if (typeof farm.server === "undefined" || farm.server === null) {
				log('ERROR', 'Farm is not running, please startFarm');
			} else {
				farm.server.addContext(uri, options);
			}
			
			callback(true, pzh);
		});
	}
}());

