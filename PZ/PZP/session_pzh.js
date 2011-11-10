(function() {

if (typeof webinos === "undefined") {
	webinos = {};
}

if (typeof exports !== "undefined") {
	webinos.message = require("./messaging.js");
	webinos.session.pzh = {};
	webinos.session.common = require('./session_common.js');
	webinos.rpc = require("./rpc.js");
} 

// Global variables and node modules that are required
var tls = require('tls'),
	events = require('events'),
	fs = require('fs'), 
	http = require('http'),
	url = require('url'),
	path = require('path'),
	WebSocketServer = require('websocket').server;
 
/* connected_pzp: holds information about PZP's connected to current PZH. 
 * It is an array which store object. An object has two fields:
 ** session : stores session id of the connected pzp
 ** socket: Holds socket information which is used while sending message to pzp
 */

var lastMsg = '', data3 = '';

function Pzh() {
	"use strict";
	this.sessionid = 0;
	this.config = {};
	this.connected_pzh = [];
	this.connected_pzp = [];
	this.writeStatus = true;
};

webinos.session.pzh.send = function (object, message, address) {
	object.sendMessage((message), address);
}

/*
 * This function is registered with message handler to send message towards rpc. 
 * It searches for correct PZP by looking in connected_pzp. It is searched 
 * based on message to field. self.connected_pzh
 * At the moment it uses JSON.stringify to send messages. As we are using objects, 
 * they need to be stringify to be processed at other end of the socket
 * @param Message to send forward
 */
//webinos.session.pzh.sendMessage = function(message, address) {
Pzh.prototype.sendMessage = function(message, address) {
	"use strict";
	var socket = ' ', i;
	var buf, self = this;
	
	webinos.session.common.debug('PZH ('+self.sessionId+') SendMessage to address ' 
	+ address ); //+ ' Message ' + JSON.stringify(message));
	if (self.connected_pzh[address]) {
		webinos.session.common.debug('PZH ('+self.sessionId+') Connected PZH ');
		self.writeStatus = self.connected_pzh[address].write(JSON.stringify(message));
	} else if (self.connected_pzp[address] && self.writeStatus) {
		webinos.session.common.debug('PZH ('+self.sessionId+') Connected PZP ');
		buf = new Buffer('#'+JSON.stringify(message)+'#');
		self.writeStatus = self.connected_pzp[address].socket.write(buf);
	} else {
		webinos.session.common.debug("PZH: Client " + address + " is not connected");
	}
	
	process.nextTick(function () {
		self.connected_pzp[address].socket.resume();
	});		
};

/* This is responsible for reading config.txt file. It is based on config.txt file, 
 * certificate names and other information for generating certificate is  fetched. 
 * If certificates are not found, they are generated. The functionality of reading 
 * contents of file and generating certificate is handled in session_common.
*/
Pzh.prototype.checkFiles = function (filename, callback) {
	"use strict";
	var self = this;
	fs.readFile(self.config.keyname, function(err) {
		if(err) {
			webinos.session.common.generateSelfSignedCert(self, function(status) {
				if(status === 'true') {
					fs.readFile(self.config.mastercertname, function(err) {
						webinos.session.common.debug('PZH ('+self.sessionId+') generating self signed signing certificate');
						webinos.session.common.generateMasterCert(self, function(result) {
							if(result === 'done') {
								webinos.session.common.debug('PZH ('+self.sessionId+') generating connection certificate signed by signing certificate');
								webinos.session.common.generateServerCertifiedCert(self, self.config, function(result) {
									if(result === 'done')
										callback.call(self, 'Certificates Created');
								});
							}
						});
					});
				}				
			});
		} else {
			callback.call(self, 'Certificates Present');
		}		
	});	
};

Pzh.prototype.connect = function () {
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
	self.sessionId = self.config.common.split(':')[0];
	
	// Registering getownid value in message handler
	webinos.message.setGet(self.sessionId);
	
	// send function to be used by message handler
	webinos.message.setSend(webinos.session.pzh.send);

	webinos.message.setObject(self);

	self.connected_pzh[self.sessionId] = {'socket': '', 
				'name': self.sessionId, 
				'address': self.server, //serverName
				'port': self.port, // serverPort
				'object':webinos.rpc.object}; // RPC objects are initialized

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
			webinos.session.common.debug("PZH: Client Authenticated ");

			cn = conn.getPeerCertificate().subject.CN;
			var data = cn.split(':');
			//server.addContext('localhost', {ca:fs.readFileSync('othercert.pem')});
			// temp work around till https is in place
			//server.setCert(fs.readFileSync('othercert.pem'));	

			// TODO: For development purpose same host can be used to run multiple client. Enabling below lines will remove duplicates
			// TODO: Differentiate PZH and PZP, but how to identify who's is who
			//found = common.checkClient(self.connected_client, cn);
			//if(found === false) {
			
			//self.connected_pzh[self.sessionId] = conn;

			// Assumption: PZH is of form ipaddr or web url
			// Assumption: PZP is of form url/mobile:Deviceid@mac
			if(data[0].indexOf('/') !== -1 ) { 
				self.connected_pzh[data[0]] = {'socket': conn, 
					'name': cn, 
					'address': conn.socket.remoteAddress, 
					'port': conn.socket.remotePort,
					'object':''};
				var otherPZH = [], myKey;
			 	//format: ownid :: client sessionid :: other connected pzp
				for (myKey in self.connected_pzh){
					webinos.session.common.debug("OtherPZH ["+myKey +"] = "+self.connected_pzh[myKey]);
					otherPZH.push(myKey);
				}
				var msg1 = { 'type': 'prop', 
					'from':  self.sessionId, 
					'to': data[0], 
					'payload': {'status':'Auth', 'message': otherPZH} };
				self.sendMessage(msg1, msg1.to);
				var msg = webinos.message.registerSender(self.sessionId, data[0]);
				self.sendMessage(msg, data[0]);

				msg = {'type': 'prop', 
					'from':  self.sessionId, 
					'payload': {'status':'PZHUpdate', 'message':otherPZP}};
				// send message to all connected PZP and PZH
				for (myKey in self.connected_pzh){
					webinos.session.common.debug("PZH: PZHUpdate ["+ myKey +"] = "+
						self.connected_pzh[myKey]);
					if(data[0] !== myKey) {
						self.sendMessage(msg, myKey);
					}
				}
			} else {
				// connected PZP session id is of form PZH/PZP's common name without device id
				sessionId = self.sessionId + "/" + data[0];

				self.connected_pzp[sessionId] = {'socket': conn, 
					'name': sessionId, 
					'address': conn.socket.remoteAddress, 
					'port': '',
					'object': ''};
				
				msg = { 'type': "prop", 
					'from':  self.sessionId, 
					'to': sessionId, 
					'payload': {'status':'Auth'}};
				self.sendMessage(msg, sessionId);
			}
		}
		/* Message is sent to PZP with payload: {status:'NotAuth', message:''}
		 * PZP when it receive message NotAuth, sends back message with its certificate. 
		 * This step is not required, but since details are not accessible via node.js 
		 * it is done explicitly.
		 */
		else {
			webinos.session.common.debug("PZH: Not Authenticated " + conn.authorizationError);
			var msg = {'type': "prop",
				'to':conn.getPeerCertificate().subject.CN.split(':')[0],
				'payload': {'status':'NotAuth'}};
			webinos.session.common.debug("PZH: Not Auth Message Sent " + msg.to);
			// This is special case as client is not listed in the connected_pzp list	
			msg = JSON.stringify(msg);			
			var buf = new Buffer('#'+msg+'#');
			conn.write(buf); 
		}
		
		conn.on('connection', function() {
			webinos.session.common.debug('PZH ('+self.sessionId+') connection established');
		});
		
		conn.on('data', function(data) {
			try {
				conn.pause();
				self.processMsg(conn, data);
			  	process.nextTick(function () {
					conn.resume();
				}); 			
			} catch (err) {
				console.log('PZH: Exception' + err);
				console.log(err.code);
				console.log(err.stack);
				
			}
		});
		
		conn.on('drain', function() {
			self.writeStatus = true;
		});
		conn.on('end', function() {
			webinos.session.common.debug('PZH ('+self.sessionId+') server connection end');
		});		

		// It calls removeClient to remove PZP from connected_client and connected_pzp.
		conn.on('close', function() {
			webinos.session.common.debug('PZH ('+self.sessionId+') socket closed');
			webinos.session.common.removeClient(self.connected_pzp, conn);
		});

		conn.on('error', function(err) {
			webinos.session.common.debug('PZH ('+self.sessionId+')' + err.code + '\n PZH: Error stack : ' + err.stack);
		});
	});
	return server;
};

Pzh.prototype.processMsg = function(conn,data) {
	var self = this;
	if(lastMsg !== '') {
		data = lastMsg+data;			
		lastMsg = '';									
	}
	var  data2 = {}, myKey;
	var data1 = {}, open = 0, i = 0, close = 0;
	var payload = null, parse;

	var msg = data.toString('utf8');//.split('#')
		
	if(msg[0] ==='#' && msg[msg.length-1] === '#') {
		msg = msg.split('#');
		parse = JSON.parse(msg[1]);
		lastMsg = '';
	} else if(msg[0] === '#' || (msg[0] !== '#' && msg[msg.length] !== '#')){
		lastMsg += data;
		return;		
	} else if(msg[msg.length-1] === '#'){
		lastMsg += data;	
		try{
			parse = JSON.parse(lastMsg);
			console.log(data2);
			lastMsg = '';
		} catch(err) {
			console.log('PZP: Accumulated data is wrong');
		}
		return;
	}
		
			
	webinos.session.common.debug('PZH ('+self.sessionId+') Received data ');
	if(typeof parse.payload !== "undefined")
		payload = parse.payload;
	/* Using contents of client certificate, a new certificate is created with issuer
	 * part of the certificate and signing part of the certificate is updated.
	 * Message is sent back to PZP, with its new certificate and server signing certificate. 
	 * Message payload contents status: signedCert and signingCert respectively for client 
	 * certificate and server signing certificate.
	 * PZP connects again to PZH with new certificates.
	 */
	if(parse.type === 'prop' && payload.status === 'clientCert' ) {
		var signingcert = (fs.readFileSync(self.config.mastercertname).toString());
		var i, id, id1=0;
		fs.readdir(__dirname, function(err, files) {
			for(i in files) {
				if( (files[i].indexOf('pzh',0) === 0) &&  
					(files[i].indexOf('client_certified', 0) !== -1)) {
						id = files[i].split('_');
						id1 = parseInt(id[2]) + 1;
				}
			}
		
			var name = 'pzh_'+self.config.common.split(':')[0]+'_'+id1;
			self.config.tempcsr = name+'_client_temp.csr';
			self.config.clientcert = name+'_client_certified.pem';

			fs.writeFile(self.config.tempcsr, payload.message, function(err) {
				if(err) throw err;
				// If we could get this setSendinformation from within key exchange in openssl,
				// it would not require certificate
				webinos.session.common.debug('PZH ('+self.sessionId+') Peer Common Name ' + 
					conn.getPeerCertificate().subject.CN);
				webinos.session.common.generateClientCertifiedCert(self.config.tempcsr, 
					self, 
					function(result) {
						if(result === 'done') {
							var msg = {'type': 'prop', 
								'to':conn.getPeerCertificate().subject.CN.split(':')[0],
								'payload': {'status':'signedCert', 
									'clientCert':
									(fs.readFileSync(self.config.clientcert).toString()), 
									'signingCert':signingcert}
								};
							console.log("PZH: Client cert Message sent");
							var buf = new Buffer('#'+JSON.stringify(msg)+'#');
							conn.write(buf);
						}
				});
			});
		});
	} else if (parse.type === 'prop' && 
		payload.status === 'pzpDetails') {
			if(self.connected_pzp[parse.from]) {
				self.connected_pzp[parse.from].port = payload.port;
				self.connected_pzp[parse.from].object = payload.object;
				var otherPZP = [];
				for(var i in self.connected_pzp) {
					otherPZP.push({'port': self.connected_pzp[i].port, 
									'name': self.connected_pzp[i].name, 
									'address':self.connected_pzp[i].address});
				}
				var msg = { 'type': "prop", 
					'from':  self.sessionId,
					'payload': {'status':'PZPUpdate', 
								'message':JSON.stringify(otherPZP)}};
			
				// send message to all connected PZP						
				for (var myKey in self.connected_pzp) {
					if(myKey !== parse.from) 
						self.sendMessage(msg, myKey);
				}
			} else {
				webinos.session.common.debug('PZH ('+self.sessionId+') Received PZP details from entity' +
					' which is not registered : ' + parse.from);
			}
	} else { // Message is forwarded to Message handler function, onMessageReceived
		webinos.session.common.debug('PZH ('+self.sessionId+') Received data : ');//+JSON.stringify(payload));
		webinos.message.setGet(self.sessionId);
		webinos.message.setSend(webinos.session.pzh.send);
		webinos.message.setObject(self);
		if(payload !== null) 
			parse.payload = payload;
		webinos.message.onMessageReceived(parse);
	}
};

Pzh.prototype.configurePZH = function(contents, callback) {
	"use strict";
	var self = this;
	var id1 = -1, id;
	var name, i, k, j;
	var flag = true, common = '', data1;
	fs.readdir(__dirname, function(err, files) {
		for(i in files) {
			if( (files[i].indexOf('pzh',0) === 0) &&  files[i].indexOf('key.pem', 0) !== -1) {
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
			name = 'pzh_'+common; //+'_'+getid;
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
			webinos.session.common.getId(self, function(getid) {
				self.config.id = getid;
			
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
			});
		} else if (flag === false) {				
			name = 'pzh_'+common;//+'_'+getid;
			self.config.keyname = name+'_conn_key.pem';
			self.config.certname = name+'_conn_cert.pem';
			self.config.common = common;
			self.config.days = 180;
			self.config.masterkeyname = name+'_master_key.pem';
			self.config.mastercertname = name+'_master_cert.pem';
			callback.call(self,'file present');	
		}			
	});	
};

//webinos.session.pzh.startHttpsServer = function(args) {
Pzh.prototype.startHttpsServer = function(args, servername) {
	var self = this;
	self.httpPort = args;
	var httpServer = http.createServer(function(request, response) {
		request.on('data', function(data) {
			var parse = JSON.stringify(data);
			console.log(parse);
			
			if(parse.method === "getMasterCert") {
				self.config.otherPZHMasterCert = parse.name;
				fs.writeFileSync(self.config.otherPZHMasterCert, parse.payload);
				response.writeHead(200, {'Content-Type': 'text/plain'});
				var payload = {'method': 'receiveMasterCert',
						'name':self.config.mastercertname, 
						'payload':fs.readFileSync(self.config.mastercertname) };
				response.write(JSON.stringify(payload));
				response.end();					
			}
		});
	    	response.writeHead(200, {'Content-Type': 'text/plain'});
		response.write("You are connected to PZH:" + self.sessionId+ "\n");
		response.end();
	});

	httpServer.on('error', function (err) {
		if (err.code == 'EADDRINUSE') {
			webinos.session.common.debug('PZP Server: Address in use');
			self.httpPort = parseInt(self.httpPort) + 1 ;
				httpServer.listen(self.httpPort, servername);
			}
		});

	httpServer.listen(self.httpPort, servername, function(){
		webinos.session.common.debug("PZH HTTPS Server: Listening on port " + self.httpPort);
	});

};

Pzh.prototype.downloadCertificate = function(servername, port) {
	console.log('in download cert');
	var options = {
		host: servername,
		port: port
	};
	console.log(options);
	var req = http.request(options, function(res) {
		console.log('in http req');
		var payload = {'name': self.config.mastercertname,
				'method': 'getMasterCert', 
				'payload':fs.readFileSync(self.config.mastercertname)};
	    	res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write(JSON.stringify(payload));
		res.end();
	});
	
	req.on('data', function(data) {
		var parse = JSON.stringify(data);
		self.config.otherPZHMasterCert = parse.name;
		fs.writeFileSync(self.config.otherPZHMasterCert, parse.payload);

	});

}

//webinos.session.pzh.connectOtherPZH = function(server, port) {
Pzh.prototype.connectOtherPZH = function(server, port) {
	var self = this;
	webinos.session.common.debug('PZH ('+self.sessionId+') Connect Other PZH');
	var options = {	key: fs.readFileSync(self.config.keyname),
			cert: fs.readFileSync(self.config.certname),
			ca: [fs.readFileSync(self.config.mastercertname), self.config.otherPZHMasterCert]}; 
			
	var conn_pzh = tls.connect(port, server, options, function(conn) {
		webinos.session.common.debug('PZH ('+self.sessionId+') Connection Status : '+conn_pzh.authorized);
		if(conn_pzh.authorized) {
			webinos.session.common.debug('PZH ('+self.sessionId+') Connected ');
		} else {
			webinos.session.common.debug('PZH ('+self.sessionId+') Not connected');
		}
		conn_pzh.on('data', function(data) {
			var parse = JSON.parse(data);
			webinos.session.common.debug('PZH ('+self.sessionId+') Message Received ');// + JSON.stringify(parse));

			if(parse.type === 'prop' && parse.payload.status === 'Auth') {
				// Message we are sending back that's why from is parse.to
				var msg = webinos.message.registerSender(parse.to, parse.from);
				self.connected_pzh[parse.from] = conn_pzh;
				var buf = new Buffer('#'+JSON.stringify(msg)+'#');
				conn_pzh.write(buf);

			} else {
				webinos.message.onMessageReceived(parse);
			}
				
		});

		conn_pzh.on('error', function() {
			webinos.session.common.debug('error');
		});

		conn_pzh.on('close', function() {
			webinos.session.common.debug('close');
		});

		conn_pzh.on('end', function() {
			webinos.session.common.debug('close');
		});

	});
};

/* starts pzh, creates servers and event listeners for listening data from clients.
 * @param server name
 * @param port: port on which server is running
 */
webinos.session.pzh.startPZH = function(contents, server, port, callback) {
	"use strict";
	var __pzh = new Pzh(), sock, msg;
	__pzh.port = port;
	__pzh.server = server;
	__pzh.configurePZH(contents, function(result) {
		__pzh.checkFiles(__pzh.config.filename, function(result) {
			webinos.session.common.debug('PZH ('+__pzh.sessionId+') Starting server: ' + result);
			sock = __pzh.connect();
			sock.on('error', function (err) {
				if (err.code == 'EADDRINUSE') {
					webinos.session.common.debug('PZH ('+__pzh.sessionId+') Address in use');
					__pzh.port = parseInt(__pzh.port) + 1 ;
					sock.listen(__pzh.port, server);
				}
			});

			sock.on('listening', function() {
				webinos.session.common.debug('PZH ('+__pzh.sessionId+') Listening on PORT ' + __pzh.port);
				callback.call(__pzh, 'startedPZH');
			});
			sock.listen(__pzh.port, server);
		});
	});
	return __pzh;
};

webinos.session.pzh.startWebSocketServer = function(hostname, serverPort, webServerPort) {
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
		webinos.session.common.debug("PZH Web Server: is listening on port "+webServerPort);
	});

	var httpserver = http.createServer(function(request, response) {
		webinos.session.common.debug("PZH Websocket Server: Received request for " + request.url);
		response.writeHead(404);
		response.end();
	});

	httpserver.on('error', function(err) {
		if (err.code === 'EADDRINUSE') {
			serverPort = parseInt(serverPort, 10) +1; 
			httpserver.listen(serverPort, hostname, function(){
				webinos.session.common.debug("PZH Websocket Server: is listening on port "
				+ serverPort +" and hostname " + hostname);
			});
		}
	});

	httpserver.listen(serverPort, hostname, function() {
		webinos.session.common.debug("PZH Websocket Server: Listening on port "+serverPort + 
			" and hostname "+hostname);

	});

	webinos.session.pzh.wsServer = new WebSocketServer({
		httpServer: httpserver,
		autoAcceptConnections: true
	});		
	
	webinos.session.pzh.wsServer.on('connect', function(connection) {
		var pzh;
		webinos.session.common.debug("PZG Websocket Server: Connection accepted.");	
		
		connection.on('message', function(message) {
			var self = this;
			var msg = JSON.parse(message.utf8Data);
			webinos.session.common.debug('PZH Websocket Server: Received packet' + 
				message.utf8Data);
			if(msg.type === 'prop' && msg.payload.status === 'startPZH') {
				//fs.writeFile(msg.payload.config.configfile, msg.payload.config.value);
				pzh = webinos.session.pzh.startPZH(msg.payload.value, 
					msg.payload.servername, 
					msg.payload.serverport, 
					function(result) {
						if(result === 'startedPZH') {
							pzh.startHttpsServer(msg.payload.httpserver, 
								msg.payload.servername);
							var info = {"type":"prop",
								"payload":{"status": "info", 
								"message":"PZH "+pzh.sessionId+" started"}
								}; 
							connection.sendUTF(JSON.stringify(info));
						}							
					});
			} else if(msg.type === 'prop' && msg.payload.status === 'downloadCert') {
				pzh.downloadCertificate(msg.payload.servername, msg.payload.serverport);
			} else if(msg.type === 'prop' && msg.payload.status === 'connectPZH') {
				pzh.connectOtherPZH(msg.payload.servername, msg.payload.serverport);
			} 
		});
		connection.on('close', function(connection) {
			webinos.session.common.debug("PZP Websocket Server: Peer " +
					connection.remoteAddress + " disconnected.");
		});	
	});
	
};

if (typeof exports !== 'undefined') {
	exports.startPZH = webinos.session.pzh.startPZH;
	exports.send = webinos.session.pzh.send;
	exports.startWebSocketServer = webinos.session.pzh.startWebSocketServer;
}

}());
