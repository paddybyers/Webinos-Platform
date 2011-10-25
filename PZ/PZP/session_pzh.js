(function() {

if (typeof webinos === "undefined") {
	webinos = {};
}

if (typeof exports !== "undefined") {
	webinos.message = require("./messaging.js");
} 

// Global variables and node modules that are required
var log = console.log,
	tls = require('tls'),
	events = require('events'),
	fs = require('fs'), 
	http = require('http');
 
/* connected_pzp: holds information about PZP's connected to current PZH. 
 * It is an array which store object. An object has two fields:
 ** session : stores session id of the connected pzp
 ** socket: Holds socket information which is used while sending message to pzp
 */
webinos.session.pzh = {};


function pzh() {
	"use strict";
	this.sessionid = 0;
	this.config = {};
	this.connected_pzh = [];
	this.connected_pzp = [];
};

/* PZH generates self event to enable message flow between different functions. 
 * This has been done to enable call flow between components
 */
pzh.prototype = new process.EventEmitter();

/*
 * This function is registered with message handler to send message towards rpc. 
 * It searches for correct PZP by looking in connected_pzp. It is searched 
 * based on message to field. self.connected_pzh
 * At the moment it uses JSON.stringify to send messages. As we are using objects, 
 * they need to be stringify to be processed at other end of the socket
 * @param Message to send forward
 */
//webinos.session.pzh.sendMessage = function(message, address) {
pzh.prototype.sendMessage = function(message, address) {
	"use strict";
	var socket = ' ', i;
	var self = this;
	log('PZH: SendMessage to address ' + address + ' Message ' + JSON.stringify(message));
	if (self.connected_pzh[address]) {
		log('PZH: Connected PZH ');
		self.connected_pzh[address].write(JSON.stringify(message));
	} else if (self.connected_pzp[address]) {
		log('PZH: Connected PZP ');
		self.connected_pzp[address].socket.write(JSON.stringify(message));
	} else {
		log("PZH: Client " + address + " is not connected");
	}
};

/* This is responsible for reading config.txt file. It is based on config.txt file, 
 * certificate names and other information for generating certificate is  fetched. 
 * If certificates are not found, they are generated. The functionality of reading 
 * contents of file and generating certificate is handled in session_common.
*/
pzh.prototype.checkFiles = function (filename, callback) {
	"use strict";
	var self = this;
	fs.readFile(self.config.keyname, function(err) {
		if(err) {
			webinos.session.common.generateSelfSignedCert(self, function(status) {
				if(status === 'true') {
					fs.readFile(self.config.mastercertname, function(err) {
						log('PZH: generating self signed signing certificate');
						webinos.session.common.generateMasterCert(self, function(result) {
							if(result === 'done') {
								log('PZH: generating connection certificate signed by signing certificate');
								webinos.session.common.generateServerCertifiedCert(self, self.config, function(result) {
									if(result === 'done')
										callback.call(self, 'certificates created');
								});
							}
						});
					});
				}
				else {
					callback.call(self, 'certificates present');
				}		
			});
		}
	});	
};

pzh.prototype.connect = function () {
	"use strict";
	var i, self, options, server, msg;
	self = this;
	var ca = [fs.readFileSync(self.config.mastercertname)];
	//if (self.config.otherPZHCert !== '')
		ca = [fs.readFileSync(self.config.mastercertname)];/*,  fs.readFileSync(self.config.otherPZHCert)*/
	// Read server configuration for creating TLS connection
	var options = {	key: fs.readFileSync(self.config.keyname),
			cert: fs.readFileSync(self.config.certname),
			ca:ca,
			requestCert:true, 
			rejectUnauthorized:false
			};
	// PZH session id is the common name assigned to it. In usual scenaio it should be URL of PZH. 
	self.sessionid = self.config.common.split(':')[0];
	
	// Registering getownid value in message handler
	webinos.message.setGet(self.sessionid);
	
	// send function to be used by message handler
	webinos.message.setSend(webinos.session.pzh.send);

	webinos.message.setObject(self);

	server = tls.createServer (options, function (conn) {
		var data = {}, obj = {}, cn, found = false, msg, parse = null, payload = {}, msg = {}, sessionId;
		/* If connection is authorized:
		* SessionId is generated for PZP. Currently it is PZH's name and 
		* PZP's CommonName and is stored in form of PZH::PZP.
		* registerClient of message manager is called to store PZP as client of PZH
		* Connected_client list is sent to connected PZP. Message sent is with payload 
		* of form {status:'Auth', message:self.connected_client} and type as prop.
 		*/
		if(conn.authorized) {
			log("PZH: Client Authenticated ");
			cn = conn.getPeerCertificate().subject.CN;
			//server.addContext('localhost', {ca:fs.readFileSync('othercert.pem')});
			// temp work around till https is in place
			//server.setCert(fs.readFileSync('othercert.pem'));	

			// TODO: For development purpose same host can be used to run multiple client. Enabling below lines will remove duplicates
			// TODO: Differentiate PZH and PZP, but how to identify who's is who
			//found = common.checkClient(self.connected_client, cn);
			//if(found === false) {
			self.connected_pzh[self.sessionid] = {'socket': conn, 
													'name': cn, 
													'address': conn.socket.remoteAddress, 
													'port': conn.socket.remotePort, 
													'object':webinos.rpc.object};
			//self.connected_pzh[self.sessionid] = conn;
			var data = cn.split(':');
			// Assumption: PZH is of form username@domain
			// Assumption: PZP is of form username@domain/mobile:Deviceid@mac
			if(data[0].indexOf('@') !== -1 /*&& data[0].indexOf('/') === -1*/) { 
				self.connected_pzh[data[0]] = {'socket': conn, 
												'name': cn, 
												'address': conn.socket.remoteAddress, 
												'port': conn.socket.remotePort, 
												'object':webinos.rpc.object} ;
				var otherPZH = [], myKey;
			 	//format: ownid :: client sessionid :: other connected pzp
				for (myKey in self.connected_pzh){
					log("OtherPZH ["+myKey +"] = "+self.connected_pzh[myKey]);
					otherPZH.push(myKey);
				}
				var msg1 = { 'type': 'prop', 
							'from':  self.sessionid, 
							'to': data[0], 
							'payload': {'status':'Auth', 'message': otherPZH} };
				self.sendMessage(msg1, msg1.to);
				var msg = webinos.message.registerSender(self.sessionid, data[0]);
				webinos.session.pzh.sendMessage(msg, data[0]);

				msg = {'type': 'prop', 
						'from':  self.sessionid, 
						'payload': {'status':'PZHUpdate', 'message':otherPZP}};
				// send message to all connected PZP and PZH
				for (myKey in self.connected_pzh){
					log("PZHUpdate ["+ myKey +"] = "+self.connected_pzh[myKey]);
					if(data[0] !== myKey) {
						self.connected_pzh[myKey].write(JSON.stringify(msg));;
					}
				}
			} else {
				// connected PZP session id is of form PZH/PZP's common name without device id
				sessionId = self.sessionid + "/" + data[0];

				self.connected_pzp[sessionId] = {'socket': conn, 
												'name': data[0], 
												'address': conn.socket.remoteAddress, 
												'port': conn.socket.remotePort,
												'object': webinos.rpc.object};
				var otherPZP = [], myKey;
				for (myKey in self.connected_pzp){
					otherPZP.push(myKey);
				}
				msg = { 'type': "prop", 
						'from':  self.sessionid, 
						'to': sessionId, 
						'payload': {'status':'Auth', 'message':otherPZP}};
				self.sendMessage(msg, sessionId);

				msg = { 'type': "prop", 
						'from':  self.sessionid, 
						'payload': {'status':'PZPUpdate', 'message':otherPZP}};
				// send message to all connected PZP and PZH
				for (myKey in self.connected_pzp){
					if(sessionId !== myKey)
						self.connected_pzp[myKey].socket.write(JSON.stringify(msg));
				}
			}
		} 
		/* Message is sent to PZP with payload: {status:'NotAuth', message:''}
		 * PZP when it receive message NotAuth, sends back message with its certificate. 
		 * This step is not required, but since details are not accessible via node.js 
		 * it is done explicitly.
		 */
		else {
			log("PZH: Not Authenticated " + conn.authorizationError);
			var msg = {'type': "prop",
						'to':conn.getPeerCertificate().subject.CN.split(':')[0],
						'payload': {'status':'NotAuth'}};
			log("PZH: Not Auth Message Sent " + msg.to);
			conn.write(JSON.stringify(msg)); // This is special case as client is not listed in the connected_pzp list	
		}
		
		conn.on('connection', function() {
			log('PZH: connection established');
		});
		
		conn.on('data', function(data) {
			log('PZH: read bytes = ' + data.length);
			parse = JSON.parse(data);
			
 			/* Using contents of client certificate, a new certificate is created with issuer
			 * part of the certificate and signing part of the certificate is updated.
			 * Message is sent back to PZP, with its new certificate and server signing certificate. 
			 * Message payload contents status: signedCert and signingCert respectively for client 
			 * certificate and server signing certificate.
			 * PZP connects again to PZH with new certificates.
			 */
			if(parse.type === 'prop' && parse.payload.status === 'clientCert' ) {
				var signingcert = (fs.readFileSync(self.config.mastercertname).toString());
				var id1 = -1, id, i;
				fs.readdir(__dirname, function(err, files) {
					for(i in files) {
						if( (files[i].indexOf('pzh',0) === 0) &&  (files[i].indexOf('client_certified', 0) !== -1)) {
							id = files[i].split('_');
							id1 = parseInt(id[2]) + 1;
							log('id1 '+id1);
						}
					}
					if(id1 === -1)
						id1 = 0;
					var name = 'pzh_'+self.config.id+'_'+id1;
					self.config.tempcsr = name+'_client_temp.csr';
					self.config.clientcert = name+'_client_certified.pem';

					fs.writeFile(self.config.tempcsr, parse.payload.message, function() {
						// If we could get this setSendinformation from within key exchange in openssl, it would not require certificate
						log('PZH: Peer Common Name ' + conn.getPeerCertificate().subject.CN);
						webinos.session.common.generateClientCertifiedCert(self.config.tempcsr, self, function(result) {
							if(result === 'done') {
								var msg = {'type': 'prop', 
										'to':conn.getPeerCertificate().subject.CN.split(':')[0],
										'payload': {'status':'signedCert', 
													'clientCert':(fs.readFileSync(self.config.clientcert).toString()), 
													'signingCert':signingcert}
										};
							
								conn.write(JSON.stringify(msg));
							}
						});
					});
				});
				
				
			} else { // Message is forwarded to Message handler function, onMessageReceived
				log('PZH: Received data : '+JSON.stringify(parse));
				webinos.message.setGet(self.sessionid);
				webinos.message.setSend(webinos.session.pzh.send);
				webinos.message.setObject(self);
				webinos.message.onMessageReceived(JSON.stringify(parse));
			}
		});

		conn.on('end', function() {
			log('PZH: server connection end');
		});		

		// It calls removeClient to remove PZP from connected_client and connected_pzp.
		conn.on('close', function() {
			log('PZH: socket closed');
			webinos.session.common.removeClient(self.connected_pzp, conn);
		});

		conn.on('error', function(err) {
			log('PZH:' + err.code + '\n PZH: Error stack : ' + err.stack);
		});
	});
	return server;
};

pzh.prototype.configurePZH = function(contents, callback) {
	"use strict";
	var self = this;
	var id1 = -1, id;
	var name, i, k, j;
	var flag = true, common = '', data1;
	webinos.session.common.getId(self, function(getid) {
		self.config.id = getid;
		fs.readdir(__dirname, function(err, files) {
			for(i in files) {
				if( (files[i].indexOf('pzh',0) === 0) &&  files[i].indexOf('key.pem', 0) !== -1) {
					id = files[i].split('_');
					data1 = contents.toString().split('\n');
					for(j = 0; j < data1.length; j += 1) {
						if(data1[j].split('=')[0] === 'common') {
							// If matches no need to generate new config
							log('read file ' + id[1]);
							common = data1[j].split('=')[1];
							log('read config ' + common);
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
				name = 'pzh_'+common+'_'+getid;
				self.config.keyname = name+'_conn_key.pem';
				self.config.certname = name+'_conn_cert.pem';
				self.config.certnamecsr = name+'_conn_cert.csr'
				self.config.keysize = 1024;
				self.config.mastercertname = name+'_master_cert.pem';
				self.config.masterkeyname = name+'_master_key.pem';
				self.config.masterkeysize = 1024;
				var i, data1 = contents.toString().split('\n');

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
				callback.call(self,'configure pzh');					
			} else if (flag === false) {
				name = 'pzh_'+common+'_'+getid;
				self.config.keyname = name+'_conn_key.pem';
				self.config.certname = name+'_conn_cert.pem';
				self.config.mastercertname = name+'_master_cert.pem';
				callback.call(self,'file present');	
			}
		});	
	});	
};
/* starts pzh, creates servers and event listeners for listening data from clients.
 * @param server name
 * @param port: port on which server is running
 */
webinos.session.pzh.startPZH = function(contents, server, port, callback) {
	"use strict";
	var __pzh = new pzh(), sock, msg;
	__pzh.port = port;
	
	__pzh.configurePZH(contents, function(result) {
		//if( result === 'configure pzh' ) {
			__pzh.checkFiles(__pzh.config.filename, function(result) {
				log('PZH: starting server: ' + result);
				sock = __pzh.connect();

				sock.on('error', function (err) {
					if (err.code == 'EADDRINUSE') {
						log('PZH: Address in use');
						__pzh.port = parseInt(__pzh.port) + 1 ;
						sock.listen(__pzh.port, server);
					}
				});

				sock.on('listening', function() {
					log('PZH: server listening on port ' + __pzh.port);
					callback.call(__pzh, 'startedPZH');
				});

				sock.listen(__pzh.port, server);
			});
		//}
	});
	return __pzh;
};

webinos.session.pzh.send = function (object, message, address) {
	object.sendMessage(message, address);
}

//webinos.session.pzh.startHttpsServer = function(args) {
pzh.prototype.startHttpsServer = function(args, servername) {
	var self = this;
	self.httpPort = args;
	var httpServer = http.createServer(function(request, response) {
		request.on('data', function(data) {
			console.log(data);
		});
    	response.writeHead(200, {'Content-Type': 'text/plain'});
		response.write("You are connected to PZH:" + self.sessionid+ "\n");
		response.end();
	});

	httpServer.on('error', function (err) {
		if (err.code == 'EADDRINUSE') {
			log('PZP Server: Address in use');
			self.httpPort = parseInt(self.httpPort) + 1 ;
				httpServer.listen(self.httpPort, servername);
			}
		});

	httpServer.listen(self.httpPort, servername, function(){
		log("PZH HTTPS Server: Listening on port " + self.httpPort);
	});

};

//webinos.session.pzh.connectOtherPZH = function(server, port) {
pzh.prototype.connectOtherPZH = function(server, port) {
	var self = this;
	log('connect other PZH');
	var options = {	key: fs.readFileSync(self.config.keyname),
			cert: fs.readFileSync(self.config.certname),
			ca: [fs.readFileSync(self.config.mastercertname), fs.readFileSync(self.config.otherPZHCert)]}; 
			
	var conn_pzh = tls.connect(port, server, options, function(conn) {
		log('PZH: Connection Status : '+conn_pzh.authorized);
		if(conn_pzh.authorized) {
			log('PZH: Connected ');
		} else {
			log('PZH: Not connected');
		}

		conn_pzh.on('data', function(data) {
			var parse = JSON.parse(data);
			log('PZH: Message Received ' + JSON.stringify(parse));

			if(parse.type === 'prop' && parse.payload.status === 'Auth') {
				// Message we are sending back that's why from is parse.to
				var msg = webinos.message.registerSender(parse.to, parse.from);
				self.connected_pzh[parse.from] = conn_pzh;
				conn_pzh.write(JSON.stringify(msg));
				
			} else {
				webinos.message.onMessageReceived(JSON.stringify(parse));
			}
				
		});

		conn_pzh.on('error', function() {
			log('error');
		});

		conn_pzh.on('close', function() {
			log('close');
		});

		conn_pzh.on('end', function() {
			log('close');
		});

	});
};


if (typeof exports !== 'undefined') {
	exports.startPZH = webinos.session.pzh.startPZH;
	exports.send = webinos.session.pzh.send;
	
}

}());
