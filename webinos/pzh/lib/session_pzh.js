/**
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
* @description session_pzh.js starts Pzh and handle communication with a messaging manager. It is also responsible for loading rpc modules. 
* It has a websocket server embedded to allow starting Pzh via web browser
*/
(function() {
	"use strict";

	// Global variables and node modules that are required
	var tls = require('tls'),
		fs = require('fs'),
		path = require('path'),
		crypto = require('crypto'),
		Pzh = null,
		sessionPzh = [],
		instance = [],
		webinosDemo = path.resolve(__dirname, '../../../demo'),
		pzhCertDir, pzhSignedCertDir, pzhOtherCertDir, pzhKeyDir, pzhRevokedCertDir;
		
	if (typeof exports !== 'undefined') {
		var rpc = require(path.resolve(__dirname, '../../common/rpc/lib/rpc.js'));
		var rpcHandler = new RPCHandler();
		var messaging = require(path.resolve(__dirname, '../../common/manager/messaging/lib/messagehandler.js'));
		messaging.setRPCHandler(rpcHandler);
		var utils = require(path.resolve(__dirname, '../../pzp/lib/session_common.js'));
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
		
		//TODO: Remove this when not testing.  What we're doing is setting the PZH to expect a PZP to connect sometime in the next day.

		this.expectingNewPzp = { 
		    status  : true, 
    		code    : "DEBUG", 
    		timeout : new Date("October 13, 2100 11:13:00")
		};

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
			utils.debug(1,'PZH ('+self.sessionId+') Exception in sending packet');
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
		try {
			var pzhRoot = webinosDemo+'/certificates/pzh';
			var pzhName = pzhRoot+'/'+self.sessionId;
			pzhCertDir = path.resolve(__dirname, pzhName+'/cert'),
			pzhSignedCertDir = path.resolve(__dirname, pzhName+'/signed_cert'),
			pzhOtherCertDir  = path.resolve(__dirname, pzhName+'/other_cert'),
			pzhKeyDir = path.resolve(__dirname, pzhName+'/keys'),
			pzhRevokedCertDir = path.resolve(__dirname, pzhName+'/signed_cert/revoked');
			fs.readFile(pzhCertDir+'/'+self.config.master.cert.name, function(err) {
				if(err !== null && err.code === 'ENOENT') {
					utils.selfSigned(self, 'Pzh', self.config.conn, function(status) {
						if(status === 'certGenerated') {
							utils.debug(2, 'PZH Generating Certificates');
							fs.readdir(webinosDemo+'/certificates', function(err) {
								if(err !== null && err.code === "ENOENT") {
									try {
										fs.mkdirSync(webinosDemo+'/certificates', '0700');								
									} catch (err) {
										utils.debug(1,'PZH ('+self.sessionId+') Error creating certificates directory');
										return;
									}
								}
								fs.readdir(pzhRoot, function(err) {
									if(err !== null && err.code === "ENOENT") {
										try {
											fs.mkdirSync(pzhRoot, '0700');
										} catch(err) {
											utils.debug(1,'PZH ('+self.sessionId+') Error creating certificates/pzh directory');
											return;
										}
									}
									fs.readdir(pzhName, function(err) {
										if(err !== null && err.code === "ENOENT") {
											try {	
												fs.mkdirSync(pzhName,'0700');
												fs.mkdirSync(pzhCertDir, '0700');								
												fs.mkdirSync(pzhKeyDir, '0700');
												fs.mkdirSync(pzhSignedCertDir, '0700');
												fs.mkdirSync(pzhOtherCertDir, '0700');
												fs.mkdirSync(pzhRevokedCertDir, '0700');
											} catch(err) {
												utils.debug(1,'PZH ('+self.sessionId+') Error creating certificates/pzh/pzh_name/ directories');
												return;
											}									
										}
										try {
											fs.writeFileSync(pzhKeyDir+'/'+self.config.conn.key.name, self.config.conn.key.value);
										} catch(err) {
											utils.debug(1,'PZH ('+self.sessionId+') Error writing key file');
											return;
										}
										utils.selfSigned(self, 'Pzh:Master', self.config.master, function(result) {
											if(result === 'certGenerated') {
												try {
													fs.writeFileSync(pzhKeyDir+'/'+self.config.master.key.name, self.config.master.key.value);
													fs.writeFileSync(pzhCertDir+'/'+self.config.master.cert.name, self.config.master.cert.value);
													fs.writeFileSync(pzhCertDir+'/'+self.config.master.crl.name, self.config.master.crl.value);
												} catch (err) {
													utils.debug(1,'PZH ('+self.sessionId+') Error writing master certificates file');
													return;
												}
												utils.signRequest(self, self.config.conn.csr.value, self.config.master, function(result, cert) {
													if(result === 'certSigned'){ 
														self.config.conn.cert.value = cert;
														try {
															fs.writeFileSync(pzhCertDir+'/'+self.config.conn.cert.name, cert);
															callback.call(self, 'Certificates Created');
														} catch (err) {
															utils.debug(1,'PZH ('+self.sessionId+') Error writing connection certificate');
															return;
														}
													}
												});
											}
										});								
									});
									
								});
							});
							
							
						}				
					});
				} else {
					self.config.master.cert.value = fs.readFileSync(pzhCertDir+'/'+self.config.master.cert.name).toString(); 
					self.config.master.key.value = fs.readFileSync(pzhKeyDir+'/'+self.config.master.key.name).toString();
					
					if ( path.existsSync(pzhCertDir+'/'+self.config.master.crl.name)) {
						self.config.master.crl.value = fs.readFileSync(pzhCertDir+'/'+self.config.master.crl.name).toString();
						utils.debug(2, "Using CRL " + pzhCertDir+'/'+self.config.master.crl.name);
					} else {
						self.config.master.crl.value = null;
						utils.debug(2, "WARNING: No CRL found.  May be worth regenerating your certificates");
					}					
					self.config.conn.cert.value = fs.readFileSync(pzhCertDir+'/'+self.config.conn.cert.name).toString(); 
					self.config.conn.key.value = fs.readFileSync(pzhKeyDir+'/'+self.config.conn.key.name).toString();
					callback.call(self, 'Certificates Present');
				}
			});
		} catch(err) {
			utils.debug(1,'PZH ('+self.sessionId+') Exception in reading/creating certificates');
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
		}
	};
	
	
	Pzh.prototype.setExpectedCode = function(code, cb) {
	    "use strict";
	    utils.debug(2, "New PZP expected, code: " + code);
	    var self = this;
	    self.expectingNewPzp.status = true;
	    self.expectingNewPzp.code = code;
	    var d = new Date(); 
	    d.setMinutes(d.getMinutes() + 10); //Timeout of ten minutes?  Should this be a config option?
	    self.expectingNewPzp.timeout = d;
	    cb();
	}
	
	Pzh.prototype.unsetExpected = function(cb) {
	    "use strict";
	    var self = this;
	    if (self.expectingNewPzp.code === "DEBUG") {
	        //We don't unset if we're allowing debug additions.
	    } else {
	        utils.debug(2,"No longer expecting PZP with code " + self.expectingNewPzp.code);
    	    self.expectingNewPzp.status = false;
	        self.expectingNewPzp.code = null;
    	    self.expectingNewPzp.timeout = null;
	    }
	    cb();
	}
	
	Pzh.prototype.isExpected = function(cb) {
	    "use strict";
	    var self = this;
	    
	    if (!self.expectingNewPzp.status) {
	        utils.debug(2, "Not expecting a new PZP");
	        cb(false);
	        return;
	    }
	    if (self.expectingNewPzp.timeout < new Date()) {
	        utils.debug(2, "Was expecting a new PZP, timed out.");
	        self.expectingNewPzp.status = false;
	        self.expectingNewPzp.code = false;
	        self.expectingNewPzp.timeout = null;
	        cb(false);
	        return;
	    } 	    
	    
	    cb ( self.expectingNewPzp.status && 
	            (self.expectingNewPzp.timeout > new Date()) );
	}
	
	Pzh.prototype.isExpectedCode = function(newcode, cb) {
	    "use strict";
	    var self = this;
	    
	    utils.debug(2, "Trying to add a PZP, code: " + newcode);
	    
	    if (!self.expectingNewPzp.status) {
	        utils.debug(2, "Not expecting a new PZP");
	        cb(false);
	        return;
	    }
	    	    
	    if (self.expectingNewPzp.code !== newcode) {
	        utils.debug(2, "Was expecting a new PZP, but code wrong");
	        cb(false);
	        return;
	    }
	        	    
	    if (self.expectingNewPzp.timeout < new Date()) {
	        utils.debug(2, "Was expecting a new PZP, code is right, but timed out.");
	        self.expectingNewPzp.status = false;
	        self.expectingNewPzp.code = false;
	        self.expectingNewPzp.timeout = null;
	        cb(false);
	        return;
	    }
	    
	    //All the above could be skipped in favour of this.
	    
	    cb( self.expectingNewPzp.status && 
	        self.expectingNewPzp.code === newcode && 
	        (self.expectingNewPzp.timeout > new Date()) );
	}
	
	
	Pzh.prototype.revoke = function(pzpCert, callback) {
		"use strict";
		var self = this;
		if (self.config.master.key.value === 'null') {
	    	    	self.config.master.key.value = fs.readFileSync(pzhKeyDir+'/'+self.config.master.key.name).toString();
		    	self.config.master.crl.value = fs.readFileSync(pzhCertDir+'/'+self.config.master.crl.name).toString();
		}
    	
		utils.revokeClientCert(self, self.config.master, pzpCert, function(result, crl) {
		    if (result === "certRevoked") {
			self.config.master.crl.value = crl;
			fs.writeFileSync(self.config.master.crl.name, crl);
			//TODO : trigger the PZH to reconnect all clients
			//TODO : trigger a synchronisation with PZPs.
			//TODO : rename the cert.
			callback(true);
		    } else {
			utils.debug(1, "Failed to revoke client certificate [" + pzpCert + "]");
			callback(false);
		    }   	    
		});		
	}
	
	/**
	* @description Starts Pzh server. It creates server configuration and then createsServer 
	*/
	Pzh.prototype.connect = function () {
		var self = this, server, ca;
		try {
			ca =  [self.config.master.cert.value];	
			
		} catch (err) {
			utils.debug(1,'PZH ('+self.sessionId+') Exception in reading other Pzh certificates');
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
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
			    utils.debug(2, "Connection authorised at PZH");
				try {
					cn = conn.getPeerCertificate().subject.CN;
					data = cn.split(':');
				} catch(err) {
					utils.debug(1,'PZH ('+self.sessionId+') Exception in reading common name of peer certificate');
					utils.debug(1, err.code);
					utils.debug(1, err.stack);
					return;
				}
				// Assumption: PZH is of form ipaddr or web url
				// Assumption: PZP is of form url@mobile:Deviceid@mac
				if(data[0] === 'Pzh' ) {
					var  pzhId, otherPzh = [], myKey;
					try {
						pzhId = data[1].split(':')[0];
					} catch (err1) {
						utils.debug(1,'PZH ('+self.sessionId+') Pzh information in certificate is in unrecognized format');
						utils.debug(1, err1.code);
						utils.debug(1, err1.stack);
						return;
					}
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
			} else {
			    utils.debug(2, "Connection NOT authorised at PZH");
			    //Sometimes, if this is a new PZP, we have to allow it.
                self.isExpected(function(expected) {
                    if (!expected ||
                         conn.authorizationError !== "UNABLE_TO_GET_CRL"){
                         //we're not expecting anything - disallow.
        			    utils.debug(2, "Ending connect: " + conn.authorizationError); 
                        conn.socket.end();
                    } else {
                        utils.debug(2, "Continuing connect - expected: " + conn.authorizationError); 
                    }
                });
              

			}
	
			conn.on('data', function(data) {
				try {
					conn.pause();
					self.processMsg(conn, data);
					process.nextTick(function () {
						conn.resume();
					});
				} catch (err) {
					utils.debug(1, 'PZH ('+self.sessionId+') Exception in processing recieved message');
					utils.debug(1, err.code);
					utils.debug(1, err.stack);
				
				}
			});
		
			conn.on('end', function() {
				utils.debug(2, 'PZH ('+self.sessionId+') Server connection end');
			});		

			// It calls removeClient to remove PZP from connected_client and connectedPzp.
			conn.on('close', function() {
				try {
					utils.debug(2, 'PZH ('+self.sessionId+') Pzh/Pzp  closed');
					var removed = utils.removeClient(self, conn);
					messaging.removeRoute(removed, self.sessionId);
				} catch (err) {
					utils.debug(1, 'PZH ('+self.sessionId+') Remove client from connectedPzp/connectedPzh failed');
					utils.debug(1, err.code);
					utils.debug(1, err.stack);					
				}
			});

			conn.on('error', function(err) {
				utils.debug(1, 'PZH ('+self.sessionId+') General Error');
				utils.debug(1, err.code);
				utils.debug(1, err.stack);
			});
		});
		return server;
	};
	
	
	Pzh.prototype.getMyUrl = function(cb) {
    	//TODO: Find out where the Pzh URL would be stored.  Config?
	     cb("http://127.0.0.1:8082/");
	}
	
	function getAllPZPIds(callback) {
        	"use strict";
		var fileArr = fs.readdirSync(pzhSignedCertDir+'/');
		var idArray = [];
		var i=0;
		for (i=0;i<fileArr.length;i++) {
			try {
				//if(fs.lstatSync(fileArr[i]).isDirectory()) {
					idArray.push( fileArr[i].split('.')[0]);			
				//}
				console.log(fileArr[i].split('.')[0]);
			} catch (err) {
				console.log(err);
			}
		}
		callback(idArray, null);
	}
	
	Pzh.prototype.addNewPZPCert = function (parse, cb) {
        "use strict";
    	var self = this;
	    try {
	        self.isExpectedCode(parse.payload.message.code, function(expected) {
	            if (expected) {
		            utils.signRequest(self, parse.payload.message.csr, self.config.master, function(result, cert) {
			            if(result === "certSigned") {
                            self.unsetExpected(function() {
				                //Save this certificate locally on the PZH.
				                //pzp name: parse.payload.message.name
				                fs.writeFileSync(webinosDemo+'/'+"client_cert_" + parse.payload.message.name + ".pem", cert);
			
				                var payload = {'clientCert': cert,
					                'masterCert':self.config.master.cert.value};
				                var msg = self.prepMsg(self.sessionId, null, 'signedCert', payload);
				                cb(null, msg);
				            });
			            } else {
			                utils.debug(1, 'PZH ('+self.sessionId+') Error Signing Client Certificate');
			                cb("Could not create client certificate - " + result, null);
			            }
		            });
	            } else {
                    var payload = {};
		            var msg = self.prepMsg(self.sessionId, null, 'failedCert', payload);
		            utils.debug(2, "Failed to create client certificate: not expected");
		            cb(null, msg);
	            }
	        });	    	    

		} catch (err) {
    		utils.debug(1, 'PZH ('+self.sessionId+') Error Signing Client Certificate');
		    utils.debug(1, err.code);
		    utils.debug(1, err.stack);
			cb("Could not create client certificate", null);
		}
		callback(idArray, null);
	}
	
	
	/** @description This is a crypto sensitive function
	*/
	Pzh.prototype.processMsg = function(conn, data) {
		var self = this;
		utils.processedMsg(self, data, 1, function(parse) {		
			if(parse.type === 'prop' && parse.payload.status === 'clientCert' ) {
				self.addNewPZPCert(parse, function(err, msg) {
                    if (err !== null) {
                        utils.debug(2, err);
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
						utils.debug(1, 'PZH ('+self.sessionId+') Received PZP details from not registered device' + parse.from);
					}
				} catch (err1) {
					utils.debug(1, 'PZH ('+self.sessionId+') Error Updating Pzh/Pzp');
					utils.debug(1, err1.code);
					utils.debug(1, err1.stack);
					return;
				}				
			} else if(parse.type === "prop" && parse.payload.status === 'findServices') {
		        utils.debug(2, 'Trying to send Webinos Services from this RPC handler...');
			    findServices(conn, self);				
			} else { // Message is forwarded to Message handler function, onMessageReceived
				try {			
					rpc.SetSessionId(self.sessionId);
					utils.sendMessageMessaging(self, parse);
				} catch (err2) {
					utils.debug(1, 'PZH ('+self.sessionId+') Error Setting RPC Session Id/Message Sending to Messaging');
					utils.debug(1, err2.code);
					utils.debug(1, err2.stack);
					return;
				}
			}
		});	
	};	
	
	function findServices(connection, pzh) {
		var services = rpcHandler.getRegisteredServices();
		debugger;
		var msg = pzh.prepMsg(pzh.sessionId, null, 'foundServices', services);
		
		pzh.sendMessage(msg, null, connection);
		
        utils.debug(2, 'Sent Webinos Services from this RPC handler.');
	}
	
	/** starts pzh, creates TLS server, resolve DNS and listens.
	 * @param contents contains certificate details
	 * @param server holds ipaddress or hostname on which pzh will be started
	 * @param port port on which server is running
	 * @returns callback with startedPzh message 
	 */
	sessionPzh.startPzh = function(contents, server, port, callback) {
		var pzh ;
		try{
			pzh = new Pzh();
			instance.push(pzh);
			pzh.port = port;
			pzh.server = server;
		} catch (err) {
			utils.debug(1, 'PZH ('+pzh.sessionId+') Error Initializing Pzh');
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
			return;
		}
		
		utils.configure(pzh, 'pzh', contents, function() {
			try {
				pzh.sessionId = pzh.config.common.split(':')[0];
			} catch (err) {
				utils.debug(1, 'PZH ('+pzh.sessionId+') Pzh information is in not correct format ');
				utils.debug(1, err.code);
				utils.debug(1, err.stack);
				return;
			}
			sessionPzh.push({ 'id': pzh.sessionId, 'connectedPzh': pzh.connectedPzhIds, 'connectedPzp': pzh.connectedPzpIds });
			
			pzh.checkFiles(function(result) {
				utils.debug(2, 'PZH ('+pzh.sessionId+') Starting PZH: ' + result);
				try {
					pzh.sock = pzh.connect();
				} catch (err) {
					utils.debug(1, 'PZH ('+pzh.sessionId+') Error starting server ');
					utils.debug(1, err.code);
					utils.debug(1, err.stack);
					return;
				}
				
				try {
					pzh.sock.on('error', function (err) {
						if (err !==  null && err.code === 'EADDRINUSE') {
							utils.debug(2, 'PZH ('+pzh.sessionId+') Address in use');
							pzh.port = parseInt(pzh.port, 10) + 1 ;
							pzh.sock.listen(pzh.port, server);
						}
					});

					pzh.sock.on('listening', function() {
						utils.debug(2, 'PZH ('+pzh.sessionId+') Listening on PORT ' + pzh.port);
						if(typeof callback !== 'undefined') {
							callback.call(pzh, 'startedPzh');
						}
					});
				
					utils.resolveIP(server, function(name) {
						server = name;
						pzh.sock.listen(pzh.port, server);
					});
				} catch (err1) {
					utils.debug(1, 'PZH ('+pzh.sessionId+') Error listening/resolving ip address ');
					utils.debug(1, err1.code);
					utils.debug(1, err1.stack);
					return;
				}
				
			});
		});
		return pzh;
	};
	
	function getPZPCertificate(pzpid, callback) {
	    "use strict";
	    try { 
	        var cert = fs.readFileSync(pzhSignedCertDir+'/'+ pzpid + ".pem");  
	        callback(true, cert);	    
	    } catch (err) {
	        utils.debug(2,"Did not find certificate " + err); 
    	    	callback(false, err);	    
	    }
	}
	
	function removeRevokedCert(pzpid, callback) {
	    "use strict";
	    try { 
	        var cert = fs.rename(pzhSignedCertDir+'/'+ pzpid + ".pem", pzhRevokedCertDir+'/'+ pzpid + ".pem");  
	        callback(true);	    
	    } catch (err) {
	        utils.debug(2,"Unable to rename certificate " + err); 
    	    callback(false);	    
	    }
	}
	
	
	function revokePzp(connection, pzpid, pzh) {
        "use strict";
        utils.debug(2,"Revocation requested of " + pzpid);
        
        var payloadErr = {
            status : "revokePzp",
            success: false,
            message: "Failed to revoke"
        };
        var msgErr = { type : 'prop', payload : payloadErr };       
        var payloadSuccess = {
            status : "revokePzp",
            success: true,
            message: "Successfully revoked"
        };
        var msgSuccess = { type : 'prop', payload : payloadSuccess };
                
        getPZPCertificate(pzpid, function(status, cert) {
            if (!status) {
                payloadErr.message = payloadErr.message + " - failed to find certificate";
        	    connection.sendUTF(JSON.stringify(msgErr));
            } else {
 	        console.log('CRL' + cert.toString());
		pzh.conn.pair.credentials.context.addCRL(cert.toString());
                pzh.revoke(cert, function(result) {
                    if (result) {
                        utils.debug(2,"Revocation success! " + pzpid + " should not be able to connect anymore ");                       
                        removeRevokedCert(pzpid, function(status2) {
                            if (!status2) {
                                utils.debug(2,"Could not rename certificate");                       
                                payloadSuccess.message = payloadSuccess.message + ", but failed to rename certificate";
                            }
                    	    connection.sendUTF(JSON.stringify(msgSuccess));
                        });                   
                    } else {
                        utils.debug(2,"Revocation failed! ");
                        payloadErr.message = payloadErr.message + " - failed to update CRL";
                	    connection.sendUTF(JSON.stringify(msgErr));
                    }        
                });      
            }
        });
	}
	
	/**
	* @param connection 
	*/
	function listAllPzps(connection) {
	    "use strict";
	    getAllPZPIds( function(pzps, error) {
	        if (error === null) {
	            var payload = {
                        status : "listAllPzps",
                        success: true,
                        message: []
                }; 
                var i=0;
	            for (i=0;i<pzps.length;i++) {
	                if (pzps[i] !== null) {
	                    payload.message.push(pzps[i]);
                    }
	            };
	        } else {
        	        var payload = {
                        status : "listAllPzps",
                        success: false,
                        message: ""
                    };                   
	        }
            var msg = {
                type    : 'prop', 
                payload : payload
            }; 
            connection.sendUTF(JSON.stringify(msg));
	    });
	}
	
	function connectedPzhPzp(connection) {
		var i;
		for( i = 0; i < instance.length; i += 1) {
			var message = {name: instance[i].sessionId, pzpId: instance[i].connectedPzpIds, pzhId: instance[i].connectedPzhIds};
			var payload = { status: 'listPzh', message: message};
			try {
				var msg = {type: 'prop', payload: payload};
				connection.sendUTF(JSON.stringify(msg));
			} catch (err) {
				utils.debug(1, 'PZH ('+pzh.sessionId+') Error sending connectedPzp/Pzh to WebClient ');
				utils.debug(1, err.code);
				utils.debug(1, err.stack);
				return;
			}
		}
	}
	
	function crashLog(connection) {
		var i;
		for( i = 0; i < instance.length; i += 1) {
			var message = {name: instance[i].sessionId, log: fs.readFileSync('crash.txt').toString()};
			var payload = {status : 'crashLog', message : message};
			try {
				var msg = {type: 'prop', payload: payload};
				connection.sendUTF(JSON.stringify(msg));
			} catch (err) {
				utils.debug(1, 'PZH ('+pzh.sessionId+') Error sending crashLog to WebClient ');
				utils.debug(1, err.code);
				utils.debug(1, err.stack);
				return;
			}
		}
	}
	
	
	function generateRandomCode() {
	    return crypto.randomBytes(8).toString("base64");
	}
	
	// Add a new PZP by generating a QR code.  This function:
	// (1) returns a QR code 
	// (2) generates a new secret code, to be held by the PZH
	// (3) tells the PZH to be ready for a new PZP to be added
	function addPzpQR(connection) {
	    "use strict";
	    var qr = require(path.resolve(__dirname, 'webinosQR.js'));
	    
	    var code = generateRandomCode();

	    instance[0].setExpectedCode(code,function() {
	        instance[0].getMyUrl(function(url) { 
	            qr.create(url, code, function(err, qrimg) {
	                if (err == null) {
	                    var message = {
	                        name: instance[0].sessionId, 
	                        img: qrimg,
	                        result: "success"
	                        };
			            var payload = {status : 'addPzpQR', message : message};
	                    var msg = {type: 'prop', payload: payload};	                    
	                    connection.sendUTF(JSON.stringify(msg));
	                } else {
	                    instance[0].unsetExpected( function() {
	                        var message = {
	                            name: instance[0].sessionId, 
	                            img: qrimg,
	                            result: "failure: not suppported"
	                            };			            
                            var payload = {status : 'addPzpQR', message : message};
	                        var msg = {type: 'prop', payload: payload};
        	                connection.sendUTF(JSON.stringify(msg));
	                    });
	                }
	            });
	        });	    
	    }); 
	}
	

	sessionPzh.startPzhWebSocketServer = function(hostname, serverPort, webServerPort, modules) {
		try {
			var http = require('http'),			
			WebSocketServer = require('websocket').server;
		} catch (err) {
			utils.debug(1, 'PZH WebSocket Server modules missing. Http and WebSocketServer are main dependencies ');
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
			return;
		}
		
		// load specified modules
		rpcHandler.loadModules(modules);
		
		var cs = http.createServer(function(request, response) { 
			var url, uri, filename;
			try {
				url = require('url');
				uri = url.parse(request.url).pathname;  
				filename = path.join(webinosDemo, uri);
			} catch (err) {
				utils.debug(1, 'PZH resolving URL/URI for file requested ');
				utils.debug(1, err.code);
				utils.debug(1, err.stack);
				return;
			}
			
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
			} else {
				utils.debug(1, 'PZH ('+pzh.sessionId+') General Pzh WebSocket Server Error');
				utils.debug(1, err.code);
				utils.debug(1, err.stack);
				return;	
			}
		});

		try {
			cs.listen(webServerPort, hostname, function(){
				utils.debug(2, 'PZH WebServer: Listening on port ' +webServerPort);
			});
		} catch (err1) {
			utils.debug(1, 'PZH ('+pzh.sessionId+') Error listening on Port');
			utils.debug(1, err1.code);
			utils.debug(1, err1.stack);
			return;	
		}

		var httpserver = http.createServer(function(request, response) {
			request.on('data', function(chunk) {
				utils.processedMessage(chunk, function(parse){
					try {
						fs.writeFile(pzhOtherCertDir+'/'+pzh.config.otherPzh, parse.payload.message, function() {
							//pzh.conn.pair.credentials.context.addCACert(pzh.config.mastercertname);
							pzh.conn.pair.credentials.context.addCACert(parse.payload.message);
							var payload = pzh.prepMsg(null, null, 'receiveMasterCert', pzh.config.master.cert.value);
							utils.debug(2, 'PZH  WSServer: Server sending certificate '+ JSON.stringify(payload).length);
							response.writeHead(200);
							response.write('#'+JSON.stringify(payload)+'#\n');
							response.end();
						});
					} catch (err) {
						utils.debug(1, 'PZH ('+pzh.sessionId+') Error Writing other Pzh certificate');
						utils.debug(1, err.code);
						utils.debug(1, err.stack);
						return;
					}
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
		
		try {
			httpserver.listen(serverPort, hostname, function() {
				utils.debug(2, 'PZH WSServer: Listening on port '+serverPort + ' and hostname '+hostname);

			});
		} catch (err2) {
			utils.debug(1, 'PZH ('+pzh.sessionId+') Error WebSocket server Listening on Port');
			utils.debug(1, err2.code);
			utils.debug(1, err2.stack);
			return;
		}

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
					var pzh= sessionPzh.startPzh(msg.payload.value, msg.payload.servername,	msg.payload.serverport, 
						function(result) {
							if(result === 'startedPzh') {
								var info = {"type":"prop","payload":{"status": "info","message":"PZH "+ pzh.sessionId+" started on port " + pzh.port}}; 
								connection.sendUTF(JSON.stringify(info));
								instance.push(pzh);
							}				
						});
				} else if(instance.length > 0) {
					if(msg.type === "prop" && msg.payload.status === 'downloadCert') {
						for( i = 0 ; i < instance.length; i++) {
							if(instance[i].sessionId === msg.payload.name) {
								downloadCertificate(instance[i], msg.payload.servername, msg.payload.serverport);
								return;	
							}							
						}
					} else if(msg.type === "prop" && msg.payload.status === 'listPzh') {
						connectedPzhPzp(connection);
					} else if(msg.type === "prop" && msg.payload.status === 'listAllPzps') {
						listAllPzps(connection);
					} else if(msg.type === "prop" && msg.payload.status === 'addPzpQR') {
						addPzpQR(connection);
					} else if(msg.type === "prop" && msg.payload.status === 'crashLog') {
						crashLog(connection);
					} else if(msg.type === "prop" && msg.payload.status === 'revokePzp') {
					    revokePzp(connection, msg.payload.pzpid, instance[0]);				
					}
				}
			});
		});

	};

	Pzh.prototype.downloadCertificate = function(servername, port) {
		var self = this;
		var http = require('http');
		var agent = new http.Agent({maxSockets: 1});
		var headers = {'connection': 'keep-alive'};
		if (servername === '' && port === '') {
			utils.debug(2, ' Pzh download certificate missing servername and port ');
			return;
		}
		
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
					try {
						fs.writeFile(pzhOtherCertDir+'/'+'pzh_cert.pem', parse.payload.message, function() {
							self.connectOtherPZH(servername, '443');
						});
					} catch (err) {
						utils.debug(1, 'PZH ('+pzh.sessionId+') Error storing other Pzh cert');
						utils.debug(1, err.code);
						utils.debug(1, err.stack);
						return;
					}
				});
			});			
		});
		try {
			var msg = self.prepMsg(null,null,'getMasterCert', pzh.config.master.cert.value);
			req.write('#'+JSON.stringify(msg)+'#\n');
			req.end();
		} catch (err) {
			utils.debug(1, 'PZH ('+pzh.sessionId+') Error sending master cert to Pzh');
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
			return;
		}
	};

	//sessionPzh.connectOtherPZH = function(server, port) {
	Pzh.prototype.connectOtherPZH = function(server, port) {
		var self = this, options;
		utils.debug(2, 'PZH ('+self.sessionId+') Connect Other PZH');
		try {
			//No CRL support yet, as this is out-of-zone communication.  TBC.
			options = {key: self.config.conn.key.value,
				cert: self.config.conn.cert.value,
				ca: [self.config.master.cert.value]}; 
		} catch (err) {
			utils.debug(1, 'PZH ('+pzh.sessionId+') Options setting failed while connecting other Pzh');
			utils.debug(1, err.code);
			utils.debug(1, err.stack);
			return;
		}
			
		var connPzh = tls.connect(port, server, options, function() {
			utils.debug(2, 'PZH ('+self.sessionId+') Connection Status : '+connPzh.authorized);
			if(connPzh.authorized) {
				var connPzhId;
				utils.debug(2, 'PZH ('+self.sessionId+') Connected ');
				try {
					connPzhId = connPzh.getPeerCertificate().subject.CN.split(':')[1];
				} catch (err) {
					utils.debug(1, 'PZH ('+pzh.sessionId+') Error reading common name of peer certificate');
					utils.debug(1, err.code);
					utils.debug(1, err.stack);
					return;
				}
				try {
					if(self.connectedPzh.hasOwnProperty(connPzhId)) {
						self.connectedPzh[connPzhId] = {socket : connPzh};
						var msg = messaging.registerSender(self.sessionId, connPzhId);			
						self.sendMessage(msg, connPzhId);
					}
				} catch (err1) {
					utils.debug(1, 'PZH ('+pzh.sessionId+') Error storing pzh in the list');
					utils.debug(1, err1.code);
					utils.debug(1, err1.stack);
					return;
				}
			} else {
				utils.debug(2, 'PZH ('+self.sessionId+') Not connected');
			}
		
			connPzh.on('data', function(data) {
				utils.processedMsg(data, 1, function(parse){
					try {
						rpc.SetSessionId(self.sessionId);
						utils.sendMessageMessaging(parse);				
					} catch (err) {
						utils.debug(1, 'PZH ('+pzh.sessionId+') Error sending message to messaging');
						utils.debug(1, err.code);
						utils.debug(1, err.stack);
					}
				});				
				
			});

			connPzh.on('error', function(err) {
				utils.debug(2, 'PZH ('+self.sessionId+') Error in connect Pzh' + err.stack );
			});

			connPzh.on('close', function() {
				utils.debug(2, 'Peer Pzh closed');
			});

			connPzh.on('end', function() {
				utils.debug(2, 'Peer Pzh End');
			});

		});
	};
	
	if (typeof exports !== 'undefined') {
		exports.startPzh = sessionPzh.startPzh;
		exports.startPzhWebSocketServer = sessionPzh.startPzhWebSocketServer;
		exports.getId = sessionPzh.getId;
		
	}
}());

