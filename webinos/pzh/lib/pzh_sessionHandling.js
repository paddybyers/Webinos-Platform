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
		crypto = require('crypto');		

	var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
	var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
	var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
	var webinosDemo  = path.resolve(__dirname, '../../../demo');
	
	/** Global variables used in Pzh */
	var Pzh = null;
	var helper     = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_helper.js'));
	var pzhapis    = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_internal_apis.js'));
	
	
	if (typeof exports !== 'undefined') {
		try {

			var rpc       = require(path.join(webinosRoot, dependencies.rpc.location));
			var MessageHandler = require(path.join(webinosRoot, dependencies.manager.messaging.location, 'lib/messagehandler.js')).MessageHandler;
			
			var authcode  = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_authcode.js'));
			
			var cert      = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
			var utils     = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));

			var RPCHandler = rpc.RPCHandler;
		} catch (err) {
			helper.debug(1, "Webinos modules missing, please check webinos installation" + err);
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
		
	    this.conn = [];
		this.tlsId = [];		
		var self = this;
		
		/* This is used for authenticating new PZPs */
		authcode.createAuthCounter(function(res) {
		    self.expecting = res;
		});

		// Handler for remote method calls.
		this.rpcHandler = new RPCHandler();

		// handler of all things message
		this.messageHandler = new MessageHandler(this.rpcHandler);
		
		// load specified modules
		this.rpcHandler.loadModules(modules);
		
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
			/** TODO: This is a temporary solution to append message with #. This is done in order to identify whole message at receiving end */
			buf = new Buffer('#'+JSON.stringify(message)+'#');
			if (self.connectedPzh.hasOwnProperty(address)) {
				helper.debug(2, 'PZH ('+self.sessionId+') Msg fwd to connected PZH ' + address);
				self.connectedPzh[address].socket.pause();
				self.connectedPzh[address].socket.write(buf);
				process.nextTick(function () {
					self.connectedPzh[address].socket.resume();
				});
			} else if (self.connectedPzp.hasOwnProperty(address)) {
				self.connectedPzp[address].socket.pause();
				helper.debug(2, 'PZH ('+self.sessionId+') Msg fwd to connected PZP ' + address);
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
				helper.debug(2, "PZH: Client " + address + " is not connected");
			} 
		} catch(err) {
			helper.debug(1,'PZH ('+self.sessionId+') Exception in sending packet ' + err);
			
		}
	};

	/**
	 * 
	 */
	Pzh.prototype.sendRegisterMessage = function () {
		var pzhId = this.conn.getPeerCertificate().subject.CN.split(':')[1];
		var msg = this.messageHandler.registerSender(this.sessionId, pzhId);
		this.sendMessage(msg, pzhId);
	};
	
	/** 
	* @descripton Checks for master certificate, if certificate is not found it calls generating certificate function defined in certificate manager. This function is crypto sensitive. 
	* @param {function} callback It is callback function that is invoked after checking/creating certificates
	*/
	Pzh.prototype.checkFiles = function (callback) {
		var self = this;
		try {
			var pzhRoot = webinosDemo+'/certificates/pzh';
			var pzhName = pzhRoot+'/'+self.sessionId;

			self.config.pzhCertDir = path.resolve(__dirname, pzhName+'/cert'),
			self.config.pzhKeyDir = path.resolve(__dirname, pzhName+'/keys'),
			self.config.pzhSignedCertDir = path.resolve(__dirname, pzhName+'/signed_cert'),
			self.config.pzhOtherCertDir  = path.resolve(__dirname, pzhName+'/other_cert'),
			self.config.pzhRevokedCertDir = path.resolve(__dirname, pzhName+'/signed_cert/revoked');
			
			fs.readFile(self.config.pzhCertDir+'/'+self.config.master.cert.name, function(err) {
				if(err !== null && err.code === 'ENOENT') {
					// 0 here specifies connection certificate
					// 1 is for master certificate
					// 2 is for PZP certificate
					cert.selfSigned(self, 'Pzh', self.config.conn, 0, function(status, selfSignErr) {
						if(status === 'certGenerated') {
							helper.debug(2, 'PZH Generating Certificates');
							fs.readdir(webinosDemo+'/certificates', function(err) {
								if(err !== null && err.code === "ENOENT") {
									try {
										fs.mkdirSync(webinosDemo+'/certificates', '0700');								
									} catch (err) {
										helper.debug(1,'PZH ('+self.sessionId+') Error creating certificates directory');
										return;
									}
								}
								fs.readdir(pzhRoot, function(err) {
									if(err !== null && err.code === "ENOENT") {
										try {
											fs.mkdirSync(pzhRoot, '0700');
										} catch(err) {
											helper.debug(1,'PZH ('+self.sessionId+') Error creating certificates/pzh directory');
											return;
										}
									}
									fs.readdir(pzhName, function(err) {
										if(err !== null && err.code === "ENOENT") {
											try {	
												fs.mkdirSync(pzhName,'0700');
												fs.mkdirSync(self.config.pzhCertDir, '0700');								
												fs.mkdirSync(self.config.pzhSignedCertDir, '0700');
												fs.mkdirSync(self.config.pzhKeyDir, '0700');
												fs.mkdirSync(self.config.pzhOtherCertDir, '0700');
												fs.mkdirSync(self.config.pzhRevokedCertDir, '0700');
											} catch(err) {
												helper.debug(1,'PZH ('+self.sessionId+') Error creating certificates/pzh/pzh_name/ directories');
												return;
											}									
										}
										
										cert.selfSigned(self, 'Pzh:Master', self.config.master, 1, function(result) {
											if(result === 'certGenerated') {
												try {
													// This is working, waiting for completion of Android and Windows part to commit code.
													/*try {
														var key =require("../../common/manager/keystore/src/build/Release/keystore");				
														key.put(self.config.master.key.name, self.config.master.key.value);
														key.put(self.config.conn.key.name, self.config.conn.key.value);
													} catch (err) {
														helper.debug(1, "Error reading key from key store "+ err);
														return;
													}*/
													
													fs.writeFileSync(self.config.pzhKeyDir+'/'+self.config.master.key.name, self.config.master.key.value);
													fs.writeFileSync(self.config.pzhKeyDir+'/'+self.config.conn.key.name, self.config.conn.key.value);
														
													fs.writeFileSync(self.config.pzhCertDir+'/'+self.config.master.cert.name, self.config.master.cert.value);
													fs.writeFileSync(self.config.pzhCertDir+'/'+self.config.master.crl.name, self.config.master.crl.value);
												} catch (err) {
													helper.debug(1,'PZH ('+self.sessionId+') Error writing master certificates file');
													return;
												}
												cert.signRequest(self, self.config.conn.csr.value, self.config.master, function(result, cert) {
													if(result === 'certSigned'){ 
														self.config.conn.cert.value = cert;
														try {
															fs.writeFileSync(self.config.pzhCertDir+'/'+self.config.conn.cert.name, cert);
															callback.call(self, 'Certificates Created');
														} catch (err) {
															helper.debug(1,'PZH ('+self.sessionId+') Error writing connection certificate');
															return;
														}
													}
												});
											}
										});								
									});
									
								});
							});
							
							
						} else {
							helper.debug(1, 'cert manager status: ' + status);
							if (typeof selfSignErr !== 'undefined') {
								helper.debug(1, 'cert manager error: ' + selfSignErr);
							}
						}
					});
				} else {

					self.config.master.cert.value = fs.readFileSync(self.config.pzhCertDir+'/'+self.config.master.cert.name).toString(); 
					self.config.master.key.value = fs.readFileSync(self.config.pzhKeyDir+'/'+self.config.master.key.name).toString(); 
					self.config.conn.key.value = fs.readFileSync(self.config.pzhKeyDir+'/'+self.config.conn.key.name).toString(); 
					self.config.conn.cert.value = fs.readFileSync(self.config.pzhCertDir+'/'+self.config.conn.cert.name).toString(); 
					
					// TODO: This works fine for linux and mac. Requires implementation on Android and Windows
					/*try{ 
						//var key =require("../../common/manager/keystore/src/build/Release/keystore");
						//self.config.master.key.value = key.get(self.config.master.key.name);
						//self.config.conn.key.value = key.get(self.config.conn.key.name);
					} catch(err){
						console.log(err);
						return;
					}*/
					
					//self.config.master.key.value = fs.readFileSync(pzhKeyDir+'/'+self.config.master.key.name).toString();
					if ( path.existsSync(self.config.pzhCertDir+'/'+self.config.master.crl.name)) {
						self.config.master.crl.value = fs.readFileSync(self.config.pzhCertDir+'/'+self.config.master.crl.name).toString();
						helper.debug(2, "Using CRL " + self.config.pzhCertDir+'/'+self.config.master.crl.name);
					} else {
						self.config.master.crl.value = null;
						helper.debug(2, "WARNING: No CRL found.  May be worth regenerating your certificates");
					}
					
					callback.call(self, 'Certificates Present');
				}
			});
		} catch(err) {
			helper.debug(1,'PZH ('+self.sessionId+') Exception in reading/creating certificates' + err);
		
		}
	};
	
	/**
	* @description Starts Pzh server. It creates server configuration and then createsServer 
	*/
	Pzh.prototype.connect = function () {
		var self = this, server, ca;
		try {
			ca =  [self.config.master.cert.value];			
		} catch (err) {
			helper.debug(1,'PZH ('+self.sessionId+') Exception in reading other Pzh certificates' + err);
			return;
		}
		
		/** @param {Object} options Creates options parameter, key, cert and ca are set */		
		var options = {key: self.config.conn.key.value,
				cert: self.config.conn.cert.value,
				ca: self.config.master.cert.value,
				crl: self.config.master.crl.value,
				requestCert:true, 
				rejectUnauthorized:false
				};

		/** Sets messaging parameter */
		utils.setMessagingParam(self, this.messageHandler);
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

			if(conn.authorized === false) {
				helper.debug(2, "Connection NOT authorised at PZH");
				//Sometimes, if this is a new PZP, we have to allow it.
				self.expecting.isExpected(function(expected) {
					if (!expected || conn.authorizationError !== "UNABLE_TO_GET_CRL"){
						//we're not expecting anything - disallow.
						helper.debug(2, "Ending connect: " + conn.authorizationError); 
						conn.socket.end();
					} else {
						helper.debug(2, "Continuing connect - expected: " + conn.authorizationError); 
					}
				});
			}
			
			conn.on('clientError', function(Exception) {
				helper.debug(1, "Client connection error: " + Exception);				 
			});
			
			if(conn.authorized) {
				helper.debug(2, "Connection authorised at PZH");
				try {
					cn = conn.getPeerCertificate().subject.CN;
					data = cn.split(':');				
				} catch(err) {
					helper.debug(1,'PZH ('+self.sessionId+') Exception in reading common name of peer certificate ' + err);

					return;
				}
				// Assumption: PZH is of form ipaddr or web url
				// Assumption: PZP is of form url@mobile:Deviceid@mac
				if(data[0] === 'Pzh' ) {
					var  pzhId, otherPzh = [], myKey;
					try {
						pzhId = data[1].split(':')[0];
					} catch (err1) {
						helper.debug(1,'PZH ('+self.sessionId+') Pzh information in certificate is in unrecognized format ' + err);
						return;
					}
					helper.debug(2, 'PZH ('+self.sessionId+') PZH '+pzhId+' Connected');
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
					sessionId = self.sessionId+'/'+data[1].split(':')[0];
					helper.debug(2, 'PZH ('+self.sessionId+') PZP '+sessionId+' Connected');
					if(!self.connectedPzp.hasOwnProperty(sessionId)) {
						self.connectedPzpIds.push(sessionId);
						self.connectedPzp[sessionId] = {'socket': conn, 
								'address': conn.socket.remoteAddress, 
								'port': ''};

					}
					msg = self.messageHandler.registerSender(self.sessionId, sessionId);
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
					helper.debug(1, 'PZH ('+self.sessionId+') Exception in processing recieved message ' + err);
				}
			});
		
			conn.on('end', function(err) {
				helper.debug(2, 'PZH ('+self.sessionId+') Server connection end' + err);
			});		

			// It calls removeClient to remove PZP from connected_client and connectedPzp.
			conn.on('close', function() {
				try {
					helper.debug(2, 'PZH ('+self.sessionId+') Pzh/Pzp  closed');
					var removed = utils.removeClient(self, conn);
					self.messageHandler.removeRoute(removed, self.sessionId);
				} catch (err) {
					helper.debug(1, 'PZH ('+self.sessionId+') Remove client from connectedPzp/connectedPzh failed' + err);
				}
			});

			conn.on('error', function(err) {
				helper.debug(1, 'PZH ('+self.sessionId+') General Error' + err);
			
			});
		});
 			
		return server;
	};
	
	Pzh.prototype.getMyUrl = function(cb) {
    	//TODO: Find out where the Pzh URL would be stored.  Config?
	     cb("http://127.0.0.1:8082/");
	}	
	
	Pzh.prototype.addNewPZPCert = function (parse, cb) {
        "use strict";
    	var self = this;
	    try {
	        self.expecting.isExpectedCode(parse.payload.message.code, function(expected) {
	            if (expected) {
		            cert.signRequest(self, parse.payload.message.csr, self.config.master, function(result, cert) {
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
			                helper.debug(1, 'PZH ('+self.sessionId+') Error Signing Client Certificate');
			                cb.call("Could not create client certificate - " + result, null);
			            }
		            });
	            } else {
                    var payload = {};
		            var msg = self.prepMsg(self.sessionId, null, 'failedCert', payload);
		            helper.debug(2, "Failed to create client certificate: not expected");
		            cb.call(null, msg);
	            }
	        });	    	    

		} catch (err) {
    		helper.debug(1, 'PZH ('+self.sessionId+') Error Signing Client Certificate' + err);
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
                        helper.debug(2, err);
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
						helper.debug(1, 'PZH ('+self.sessionId+') Received PZP details from not registered device' + parse.from);
					}
				} catch (err1) {
					helper.debug(1, 'PZH ('+self.sessionId+') Error Updating Pzh/Pzp' + err1);
					return;
				}				
			} else if(parse.type === "prop" && parse.payload.status === 'registerServices') {
				helper.debug(2, 'Receiving Webinos Services from PZP...');
				var pzpServices = parse.payload.message;
				self.rpcHandler.addRemoteServiceObjects(pzpServices);
			} else if(parse.type === "prop" && parse.payload.status === 'findServices') {
				helper.debug(2, 'Trying to send Webinos Services from this RPC handler to ' + parse.from + '...');
				var services = self.rpcHandler.getAllServices(parse.from);
				var msg = self.prepMsg(self.sessionId, null, 'foundServices', services);		
				self.sendMessage(msg, null, conn);		
		        helper.debug(2, 'Sent ' + (services && services.length) || 0 + ' Webinos Services from this RPC handler.');
			} else { // Message is forwarded to Message handler function, onMessageReceived
				try {			
					rpc.setSessionId(self.sessionId);
					utils.sendMessageMessaging(self, this.messageHandler, parse);
				} catch (err2) {
					helper.debug(1, 'PZH ('+self.sessionId+') Error Setting RPC Session Id/Message Sending to Messaging ' + err2);
					return;
				}
			}
		});	
	};	
	
	/** starts pzh, creates TLS server, resolve DNS and listens.
	 * @param contents contains certificate details
	 * @param server holds ipaddress or hostname on which pzh will be started
	 * @param port port on which server is running
	 * @param modules array of Webinos modules
	 * @returns callback with startedPzh message 
	 */
	function startPzh(contents, server, port, modules, callback) {
		var pzh;
		try{
			pzh = new Pzh(modules);
			pzh.port = port;
			pzh.server = server;
			pzh.contents = contents;		
		} catch (err) {
			helper.debug(1, 'PZH - Error Initializing Pzh '  + err);
			return;
		}
		var dir = webinosDemo + '/certificates/pzh'
		utils.configure(pzh, dir, 'pzh', contents, function() {
			try {
				pzh.sessionId = pzh.config.common.split(':')[0];
				var crashMsg = fs.createWriteStream(webinosDemo + '/'+ pzh.sessionId + '_crash.txt', {'flags': 'a'});
				helper.setDebugStream(crashMsg);
			} catch (err) {
				helper.debug(1, 'PZH ('+pzh.sessionId+') Pzh information is not in correct format ' + err);
				return;
			}
			//sessionPzh.push({ 'id': pzh.sessionId, 'connectedPzh': pzh.connectedPzhIds, 'connectedPzp': pzh.connectedPzpIds });
			pzh.checkFiles(function(result) {
				helper.debug(2, 'PZH ('+pzh.sessionId+') Starting PZH: ' + result);
				try {
					pzh.sock = pzh.connect();			
				} catch (err) {
					helper.debug(1, 'PZH ('+pzh.sessionId+') Error starting server ' + err);
					return;
				}
				try {
					pzh.sock.on('error', function (err) {
						if (err !==  null && err.code === 'EADDRINUSE') {
							helper.debug(2, 'PZH ('+pzh.sessionId+') Address in use');
							pzh.port = parseInt(pzh.port, 10) + 1 ;
							pzh.sock.listen(pzh.port, server);
						}
					});

					pzh.sock.on('listening', function() {
						helper.debug(2, 'PZH ('+pzh.sessionId+') Listening on PORT ' + pzh.port);
						if(typeof callback !== 'undefined') {
							callback.call(pzh, 'startedPzh', pzh);
						}
					});
				
					utils.resolveIP(server, function(resolvedAddress) {
						server = resolvedAddress;
						helper.debug(3, "Connecting Address" + server);
						pzh.sock.listen(pzh.port, server);
					});
				} catch (err1) {
					helper.debug(1, 'PZH ('+pzh.sessionId+') Error listening/resolving ip address ' + err1);					
					return;
				}
				
			});
		});
		return pzh;
	};
	
	function restartPzh(instance, callback) {
		try	{
			instance.conn.end();
			instance.sock.close();
			startPzh(instance.contents, instance.server, instance.port, function(result){
				callback(result);
			});
		} catch(err) {
			helper.debug(1, 'Pzh restart failed ' + err);
		}
	}
	
	
	if (typeof exports !== 'undefined') {
		exports.startPzh = startPzh;
		exports.restartPzh = restartPzh;
		
	}
}());

