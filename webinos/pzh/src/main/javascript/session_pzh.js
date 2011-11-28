(function() {

if (typeof exports !== "undefined") {
	var webinosMessage = require("../../../../common/rpc/src/main/javascript/messagehandler.js");
	var sessionPzh = {};
	var utils = require('../../../../pzp/src/main/javascript/session_common.js');
}

// Global variables and node modules that are required
var tls = require('tls'),
	events = require('events'),
	fs = require('fs'),
	crypto = require('crypto'),
	http = require('http'),
	url = require('url'),
	path = require('path'),
	WebSocketServer = require('websocket').server;
 
/* connected_pzp: holds information about PZP's connected to current PZH. 
 * It is an array which store object. An object has two fields:
 ** session : stores session id of the connected pzp
 ** socket: Holds socket information which is used while sending message to pzp
 */

function Pzh() {
	"use strict";
	this.sessionid = 0;
	this.config = {};
	this.connected_pzh = [];
	this.connected_pzp = [];
	this.lastMsg = '';
};

sessionPzh.send = function (message, address, object) {
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
Pzh.prototype.sendMessage = function(message, address) {
	"use strict";
	var buf, self = this;
	utils.debug('PZH ('+self.config.sessionId+') SendMessage to address ' + address ); 
	try{
		if (self.connected_pzh[address]) {
			utils.debug('PZH ('+self.config.sessionId+') Msg fwd to connected PZH ');
			buf = new Buffer('#'+JSON.stringify(message)+'#');
			self.connected_pzh[address].socket.pause();
			self.connected_pzh[address].socket.write(buf);
			process.nextTick(function () {
				self.connected_pzh[address].socket.resume();
			});
		} else if (self.connected_pzp[address]) {
			utils.debug('PZH ('+self.config.sessionId+') Msg fwd to connected PZP ');
			buf = new Buffer('#'+JSON.stringify(message)+'#');
			self.connected_pzp[address].socket.pause();
			self.connected_pzp[address].socket.write(buf);
			process.nextTick(function () {
				self.connected_pzp[address].socket.resume();
			});
		} else {
			utils.debug("PZH: Client " + address + " is not connected");
		}
	} catch(err) {
		utils.debug('PZH ('+self.config.sessionId+') Exception' + err);
		utils.debug(err.code);
		utils.debug(err.stack);
	}
};

/* configurePZH calls this method
*  certificate names and other information for generating certificate is  fetched. 
 * If certificates are not found, they are generated. The functionality of reading 
 * contents of file and generating certificate is handled in session_common.
*/
Pzh.prototype.checkFiles = function (filename, callback) {
	"use strict";
	var self = this;
	fs.readFile(self.config.keyname, function(err) {
		if(err) {
			utils.generateSelfSignedCert(self, function(status) {
				if(status === 'true') {
					fs.readFile(self.config.mastercertname, function(err) {
						utils.debug('PZH ('+self.config.sessionId+
						') Generating Certificates');
						utils.generateMasterCert(self, function(result) {
						if(result === 'done') {
						utils.generateServerCertifiedCert(self, self.config, 
						function(result) {
							if(result === 'done')
							callback.call(self, 'Certificates Created');
						});}});
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
	var i, self, server, msg;
	self = this;
	var ca =  [fs.readFileSync(self.config.mastercertname)];
	var added = false;
	
	if(typeof self.config.otherPZHMasterCert !== 'undefined'){
               ca = [fs.readFileSync(self.config.mastercertname), 
               	fs.readFileSync(self.config.otherPZHMasterCert)];
       }

	// Read server configuration for creating TLS connection
	var options = {key: fs.readFileSync(self.config.keyname),
			cert: fs.readFileSync(self.config.certname),
			ca: fs.readFileSync(self.config.mastercertname),
			requestCert:true, 
			rejectUnauthorized:false
			};

	// PZH session id is the common name assigned to it. In usual scenaio it should be URL of PZH. 
	self.config.sessionId = self.config.common.split(':')[0];
	
	// Registering getownid value in message handler
	webinosMessage.setGetOwnId(self.config.sessionId);
	
	// send function to be used by message handler
	webinosMessage.setSendMessage(sessionPzh.send);

	webinosMessage.setObjectRef(self);

	self.connected_pzh[self.config.sessionId] = {'socket': '', 
				'name': self.config.sessionId, 
				'address': self.server, //serverName
				'port': self.port}; // RPC objects are initialized

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
			var data = cn.split('@');
			var found = utils.checkClient(self, cn);
			if(found === false) {
				// Assumption: PZH is of form ipaddr or web url
				// Assumption: PZP is of form url@mobile:Deviceid@mac
				if(data.length === 1 ) {
					var otherPZHId = data[0].split(':')[0];
					var otherPZH = [], myKey;
					utils.debug('PZH ('+self.config.sessionId+') PZH '
						+otherPZHId+' Connected');
					self.connected_pzh[otherPZHId] = {'socket': conn,
						'name': otherPZHId, 
						'address': conn.socket.remoteAddress, 
						'port': conn.socket.remotePort};
					for (myKey in self.connected_pzh){
						otherPZH.push(myKey);
					}
					var msg1 = { 'type': 'prop', 
						'from':  self.config.sessionId, 
						'to': otherPZHId, 
						'payload': {'status':'Auth', 'message': otherPZH} };
					self.sendMessage(msg1, otherPZHId);					
					msg=webinosMessage.registerSender(self.config.sessionId, otherPZHId);
					self.sendMessage(msg, otherPZHId);
				} else if(data.length === 2 ) { 
					sessionId = data[0]+'@'+data[1].split(':')[0];
					utils.debug('PZH ('+self.config.sessionId+') PZP '
						+sessionId+' Connected');

					self.connected_pzp[sessionId] = {'socket': conn, 
						'name': sessionId, 
						'address': conn.socket.remoteAddress, 
						'port': ''};
				
					msg = { 'type': "prop", 
						'from':  self.config.sessionId,
						'to': sessionId, 
						'payload': {'status':'Auth'}};
					self.sendMessage(msg, sessionId);
				}
			}
		}
		/* Message is sent to PZP with payload: {status:'NotAuth', message:''}
		 * PZP when it receive message NotAuth, sends back message with its certificate. 
		 * This step is not required, but since details are not accessible via node.js 
		 * it is done explicitly.
		 */
		else {
			utils.debug("PZH: Certificate Not Authenticated " + conn.authorizationError);
			var msg = {'type': "prop",
				'from':self.config.sessionId,
				'payload': {'status':'NotAuth'}};
			// This is special case as client is not listed in the connected_pzp list	
			try {
				conn.pause();
				var buf = new Buffer('#'+JSON.stringify(msg)+'#');
				conn.write(buf);
				process.nextTick(function () {
					conn.resume();
				});
			}  catch (err) {
				utils.debug('PZH ('+self.config.sessionId+') Exception' + err);
				utils.debug(err.code);
				utils.debug(err.stack);			
			}
		}
		
		conn.on('connect', function() {
			utils.debug('PZH ('+self.config.sessionId+') connection established');
		});
		
		conn.on('data', function(data) {
			try {
				conn.pause();
				self.processMsg(conn, data);
			  	process.nextTick(function () {
					conn.resume();
				}); 			
			} catch (err) {
				utils.debug('PZH ('+self.config.sessionId+') Exception' + err);
				utils.debug(err.code);
				utils.debug(err.stack);
				
			}
		});
		
		conn.on('end', function() {
			utils.debug('PZH ('+self.config.sessionId+') Server connection end');
		});		

		// It calls removeClient to remove PZP from connected_client and connected_pzp.
		conn.on('close', function() {
			utils.debug('PZH ('+self.config.sessionId+') PZP Socket closed');
			utils.removeClient(self.connected_pzp, conn);
		});

		conn.on('error', function(err) {
			utils.debug('PZH ('+self.config.sessionId+')' + err.code );
			utils.debug(err.stack);
		});
	});
	return server;
};

Pzh.prototype.processMsg = function(conn,data) {
	var self = this;
	if(self.lastMsg !== '') {
		data = self.lastMsg+data;			
		self.lastMsg = '';									
	}
	var  data2 = {}, myKey;
	var data1 = {}, open = 0, i = 0, close = 0;
	var payload = null, parse;

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
			utils.debug('PZH ('+self.config.sessionId+') Accumulated data is wrong');
		}
		return;
	}		
			
	utils.debug('PZH ('+self.config.sessionId+') Received data ');
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
		var i, id, id1=0;
		fs.readdir(__dirname, function(err, files) {
			for(var i=0; i<files.length; i++) {
				if( (files[i].indexOf('pzh',0) === 0) &&  
				(files[i].indexOf('client_certified', 0) !== -1)) {
					id = files[i].split('_');
					id1 = parseInt(id[2]) + 1;
				}
			}
		
			var name = 'pzh_'+self.config.common.split(':')[0]+'_'+id1;
			self.config.tempcsr = name+'_client_temp.csr';
			self.config.clientcert = name+'_client_certified.pem';

			// If we could get this information from within key exchange in openssl,
			// it would not require certificate
			fs.writeFile(self.config.tempcsr, payload.cert, function() {
				utils.generateClientCertifiedCert(self, function(result) {
				if(result === 'done') {
					var msg = {'type': 'prop',
					'to': parse.from,
					'payload': {'status':'signedCert', 
					'clientCert':
					(fs.readFileSync(self.config.clientcert).toString()), 
					'signingCert':
					(fs.readFileSync(self.config.mastercertname).toString())}};					
					 try {
						conn.pause();
						var buf = new Buffer('#'+JSON.stringify(msg)+'#');
						conn.write(buf);
						process.nextTick(function () {
							conn.resume();
						});
					}  catch (err) {
						utils.debug('PZH ('+self.config.sessionId+') Exception' + err);
						utils.debug(err.code);
						utils.debug(err.stack);			
					}					
				}});
			});
		});
	} else if (parse.type === 'prop' && 
		payload.status === 'pzpDetails') {
		if(self.connected_pzp[parse.from]) {
			self.connected_pzp[parse.from].port = payload.port;
			var otherPZP = [];
			for(var i in self.connected_pzp) {
				otherPZP.push({'port': self.connected_pzp[i].port, 
				'name': self.connected_pzp[i].name, 
				'address':self.connected_pzp[i].address});
			}
			var msg = { 'type': "prop", 
			'from':  self.config.sessionId,
			'payload': {'status':'PZPUpdate', 
			'message':JSON.stringify(otherPZP)}};
			
				// send message to all connected PZP						
			for (var myKey in self.connected_pzp) {
				if(myKey !== parse.from) 
					self.sendMessage(msg, myKey);
			}
		} else {
			utils.debug('PZH ('+self.config.sessionId+') Received PZP details from entity' +
			' which is not registered : ' + parse.from);
		}
	} else { // Message is forwarded to Message handler function, onMessageReceived
		webinosMessage.setGetOwnId(self.config.sessionId);
	
		webinosMessage.setSendMessage(sessionPzh.send);
		webinosMessage.setObjectRef(self);
		if(payload !== null) 
			parse.payload = payload;
		webinos.message.setSeparator("/");
		webinosMessage.onMessageReceived(parse);
	}
};

Pzh.prototype.configurePZH = function(contents, callback) {
	"use strict";
	var self = this;
	var id1 = -1, id;
	var name, i, k, j;
	var flag = true, common = '', data1;
	fs.readdir(__dirname, function(err, files) {
		for(var i=0; i<files.length; i++) {
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
			utils.getId(self, function(getid) {
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
						self.config.common = data1[i][1] + 
						':DeviceId:('+self.config.id+')';
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
			var parse, msg = data.toString('utf8');//.split('#')
		
			if(msg[0] ==='#' && msg[msg.length-2] === '#') {
				msg = msg.split('#');
				parse = JSON.parse(msg[1]);
				lastMsg = '';
			} else if(msg[0] === '#' || (msg[0] !== '#' && msg[msg.length-2] !== '#')){
				lastMsg += data;
				return;		
			}
			self.config.otherPZHMasterCert= parse.payload.certname;
			fs.writeFile(self.config.otherPZHMasterCert, parse.payload.cert, function() {
				self.connectOtherPZH(servername, '443');
			});

		});			
	});
	
	var payload = {'type':'prop',
			'payload':{'status':'getMasterCert',
				'certname': self.config.certname,
				'cert':fs.readFileSync(self.config.mastercertname).toString()}};	
	req.write('#'+JSON.stringify(payload)+'#\n');
	req.end();
}

//sessionPzh.connectOtherPZH = function(server, port) {
Pzh.prototype.connectOtherPZH = function(server, port) {
	var self = this;
	utils.debug('PZH ('+self.config.sessionId+') Connect Other PZH');
	var options = {	key: fs.readFileSync(self.config.keyname),
			cert: fs.readFileSync(self.config.certname),
			ca: [fs.readFileSync(self.config.mastercertname), 
			fs.readFileSync(self.config.otherPZHMasterCert)]}; 
			
	var conn_pzh = tls.connect(port, server, options, function(conn) {
		utils.debug('PZH ('+self.config.sessionId+') Connection Status : '+conn_pzh.authorized);
		if(conn_pzh.authorized) {
			utils.debug('PZH ('+self.config.sessionId+') Connected ');
		} else {
			utils.debug('PZH ('+self.config.sessionId+') Not connected');
		}
		conn_pzh.on('data', function(data) {
			var parse;
			var msg = data.toString('utf8');//.split('#')
		
			if(msg[0] ==='#' && msg[msg.length-1] === '#') {
				msg = msg.split('#');
				parse = JSON.parse(msg[1]);
				lastMsg = '';
			} else if(msg[0] === '#' || (msg[0] !== '#' && msg[msg.length-1] !== '#')){
				lastMsg += data;
				return;		
			} else if(msg[msg.length-1] === '#'){				
				try{
					parse = JSON.parse(lastMsg);
					lastMsg = '';
				} catch(err) {
					utils.debug('PZH ('+self.config.sessionId+
						') Accumulated data is wrong');
				}
				return;
			}
			
			
			utils.debug('PZH ('+self.config.sessionId+') Message Received ');

			if(parse.type === 'prop' && parse.payload.status === 'Auth') {
				// Message we are sending back that's why from is parse.to
				var msg = webinosMessage.registerSender(parse.to, parse.from);
				self.connected_pzh[parse.from] = conn_pzh;
				var buf = new Buffer('#'+JSON.stringify(msg)+'#');
				conn_pzh.write(buf);

			} else {
				webinos.message.setSeparator("/");
				webinosMessage.onMessageReceived(parse);
			}
				
		});

		conn_pzh.on('error', function() {
			utils.debug('PZH ('+self.config.sessionId+')' + err.code );
			utils.debug(err.stack);
		});

		conn_pzh.on('close', function() {
			utils.debug('close');
		});

		conn_pzh.on('end', function() {
			utils.debug('close');
		});

	});
};

/* starts pzh, creates servers and event listeners for listening data from clients.
 * @param server name
 * @param port: port on which server is running
 */
sessionPzh.startPZH = function(contents, server, port, callback) {
	"use strict";
	var __pzh = new Pzh(), sock, msg;
	__pzh.port = port;
	__pzh.server = server;
	__pzh.configurePZH(contents, function(result) {
		__pzh.checkFiles(__pzh.config.filename, function(result) {
			utils.debug('PZH ('+__pzh.sessionId+') Starting PZH: ' + result);
			__pzh.sock = __pzh.connect();
			__pzh.sock.on('error', function (err) {
				if (err.code == 'EADDRINUSE') {
					utils.debug('PZH ('+__pzh.sessionId+') Address in use');
					__pzh.port = parseInt(__pzh.port) + 1 ;
					__pzh.sock.listen(__pzh.port, server);
				}
			});

			__pzh.sock.on('listening', function() {
				utils.debug('PZH ('+__pzh.sessionId+') Listening on PORT ' + __pzh.port);
				callback.call(__pzh, 'startedPZH');
			});
			__pzh.sock.listen(__pzh.port, server);
		});
	});
	return __pzh;
};

sessionPzh.startWebSocketServer = function(hostname, serverPort, webServerPort) {
	var self = this;
	var pzh;
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
		utils.debug('PZH ('+pzh.config.sessionId+') WebServer: Listening on port '
			+webServerPort);
	});

	var httpserver = http.createServer(function(request, response) {
		request.on('data', function(chunk) {
			if(lastMsg !== '') {
				chunk = lastMsg+chunk;			
				lastMsg = '';									
			}

			var payload = null, parse;

			var msg = chunk.toString('utf8');//.split('#')
		
			if(msg[0] ==='#' && msg[msg.length-2] === '#') {
				msg = msg.split('#');
				parse = JSON.parse(msg[1]);
				lastMsg = '';
			} else if(msg[0] === '#' || (msg[0] !== '#' && msg[msg.length-2] !== '#')){
				lastMsg += chunk;
				return;		
			} else if(msg[msg.length-2] === '#'){				
				try{
					parse = JSON.parse(lastMsg);
					lastMsg = '';
				} catch(err) {
					utils.debug('PZH ('+pzh.config.sessionId+') WSServer:'+
					' Accumulated data is wrong');
				}
				return;
			}
			
		
			pzh.config.otherPZHMasterCert= parse.payload.certname;
			fs.writeFile(pzh.config.otherPZHMasterCert, parse.payload.cert, function() {
				//pzh.conn.pair.credentials.context.addCACert(pzh.config.mastercertname);
               			pzh.conn.pair.credentials.context.addCACert(parse.payload.cert);
        			var payload = {'type':'prop',
				'payload':{'status':'receiveMasterCert',
					'certname': pzh.config.mastercertname,
					'cert':fs.readFileSync(pzh.config.mastercertname).toString()}};
				utils.debug('PZH ('+pzh.config.sessionId+') WSServer:'+ 
					'Server sending certificate '+ JSON.stringify(payload).length);
				response.writeHead(200);		
				response.write('#'+JSON.stringify(payload)+'#\n');
				response.end();
			});

		});
		request.on('end', function(data) {
		    utils.debug('PZH ('+pzh.config.sessionId+') WSServer: Message End');

		});
	});
	
	httpserver.on('error', function(err) {
		if (err.code === 'EADDRINUSE') {
			serverPort = parseInt(serverPort, 10) +1; 
			httpserver.listen(serverPort, hostname);
		}
	});

	httpserver.listen(serverPort, hostname, function() {
		utils.debug('PZH ('+pzh.config.sessionId+' WSServer: Listening on port '+serverPort + 
			' and hostname '+hostname);

	});

	sessionPzh.wsServer = new WebSocketServer({
		httpServer: httpserver,
		autoAcceptConnections: true
	});
	
	sessionPzh.wsServer.on('connect', function(connection) {
		utils.debug('PZH ('+pzh.config.sessionId+' WSServer: Connection accepted.');
		connection.on('message', function(message) {
			var self = this;
			var msg = JSON.parse(message.utf8Data);
			utils.debug('PZH ('+pzh.config.sessionId+' WSServer: Received packet' + 
				JSON.stringify(msg));
			if(msg.type === 'prop' && msg.payload.status === 'startPZH') {
				pzh = sessionPzh.startPZH(msg.payload.value, 
					msg.payload.servername, 
					msg.payload.serverport, 
					function(result) {
						if(result === 'startedPZH') {
							var info = {"type":"prop", 
							"payload":{"status": "info", 
							"message":"PZH started"}}; 
							connection.sendUTF(JSON.stringify(info));
						}							
					});
			} else if(msg.type === "prop" && msg.payload.status === 'downloadCert') {
				pzh.downloadCertificate(msg.payload.servername,
					msg.payload.serverport);				
			}
		});
	});

};

if (typeof exports !== 'undefined') {
	exports.startPZH = sessionPzh.startPZH;
	exports.send = sessionPzh.send;
	exports.startWebSocketServer = sessionPzh.startWebSocketServer;
}

}());
