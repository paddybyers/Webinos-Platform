/* It is a client to PZH
 * It runs two servers:
 ** TLS server for allowing other PZP's to connect to it
 ** WebSocket Server to allow websocket connection with the browser
 * It is dependent on session common and messaging
 */
(function() {

if (typeof webinos === "undefined") {
	webinos = {};
}

if (typeof exports !== "undefined") {
	//webinos.message = require("../../PZ/PZP/messaging.js");
	webinos.message = require("./messaging.js");
} 
webinos.session = {};
webinos.session.pzh = require('./session_pzh.js');
webinos.session.pzp = {};
webinos.session.common = require('./session_common.js');

var log = console.log,
  tls = require('tls'),
  events = require('events'),
  fs = require('fs'),
  http = require("http"), 
  url = require("url"),
  path = require("path"),
  WebSocketServer = require('websocket').server;


pzp = function() {
	"use strict";
	this.serverPort = 9000;
}

//This structure holds socket connection information of the server.
webinos.session.pzp.clientSocket = {};
// Stores PZH information
webinos.session.pzp.serverName = [];
// Stores own id, this is generated by PZH
webinos.session.pzp.sessionId = 0;
// ServiceSessionId for the connected Apps
webinos.session.pzp.serviceSessionId = 0;
// It is used by PZP server for holding list of PZP
webinos.session.pzp.connectedClient = [];
// List of other connected PZH to PZH. In future, other connected PZH information could also be stored in similar structure
webinos.session.pzp.otherPZP = [];
// List of connected apps i.e session with browser
webinos.session.pzp.connected_app = {};
//Configuration details
webinos.session.pzp.config = {};

pzp.prototype = new process.EventEmitter();

webinos.session.pzp.getPZPSessionId = function () {
	return webinos.session.pzp.sessionId;
};

webinos.session.pzp.getPZHSessionId = function() {
	return webinos.session.pzp.serverName;
};

webinos.session.pzp.setServiceSessionId = function() {
	webinos.session.pzp.serviceSessionId += 1;
	return webinos.session.pzp.serviceSessionId;
};

webinos.session.pzp.getServiceSessionId = function() {
	return webinos.session.pzp.serviceSessionId;
};

webinos.session.pzp.getOtherPZP = function() {
	var i;
	if(typeof webinos.session.pzp.otherPZP !== 'undefined') {
		for ( i = 0; i < webinos.session.pzp.otherPZP.length; i += 1) {
			log(webinos.session.pzp.otherPZP[i]);
			if (webinos.session.pzp.otherPZP[i] === webinos.session.pzp.sessionId)
				continue;
			else
				return webinos.session.pzp.otherPZP[i];
		}
	}
};

/* It is responsible for sending message to correct entity. It checks if message is
 * for Apps connected via WebSocket server. It forwards message to the correct 
 * WebSocket client or else message is send to PZH
 * @param message to be sent forward
 */
webinos.session.pzp.sendMessage = function(message, address) {
	var i;
	if(webinos.session.pzp.connected_app[address]) { 	// it should be for the one of the apps connected.
		log("PZP: Message forwarded to one of the connected app on websocket server ");
		conn = webinos.session.pzp.connected_app[address];
		conn.sendUTF(JSON.stringify(message));
	} else {
		// This is for communicating with PZH
		log("PZP: Forward to PZH");
		webinos.session.pzp.clientSocket.write(JSON.stringify(message));
	}	
};

/* Similar to PZH with only difference that it generates self signed certificate, 
 * in case if certificates are found it updates the structure.
 */
pzp.prototype.checkFiles = function () {
	"use strict";
	var self, options;
	self = this;
	webinos.session.common.readConfig('config_pzp.txt', webinos.session.pzp, self);
	self.on('readConfig',function () {
		webinos.session.common.generateSelfSignedCert(webinos.session.pzp, self);
		self.on('generatedCert', function(status) {
			if(status === 'true') {
				options = {
					key: fs.readFileSync(webinos.session.pzp.config.keyname),
					cert: fs.readFileSync(webinos.session.pzp.config.certname)
				};
				self.emit('configSet',options);
			} else {
 				options = {
					key: fs.readFileSync(webinos.session.pzp.config.keyname),
					cert: fs.readFileSync(webinos.session.pzp.config.certname),
					ca: fs.readFileSync(webinos.session.pzp.config.mastercertname)
				};
				self.emit('configSet', options);
			}
		});
	});	
};

/* It is responsible for connecting with PZH and handling events.
 * It does JSON parsing of received message
 */
pzp.prototype.connect = function (options, servername, port) {
	"use strict";
	var self, client;
	self = this;
	client = tls.connect(port, servername, options, function(conn) {
		log('PZP: connect status: ' + client.authorized);
		webinos.session.pzp.clientSocket = client;
	});

	client.on('data', function(data) {
		log('PZP: data received : ' + data.length);
		var data1, send, payload = {}, msg = {};
		data1 = JSON.parse(data);
		//log('PZP:'+JSON.stringify(data1));
		/* If sends the client certificate to get signed certificate from server. 
		 * Payload message format {status: 'clientCert', message: certificate)
		 */
		if (data1.type === 'prop' && data1.payload.status === 'NotAuth') {
			log('PZP: Not Authenticated');
			payload = {'status':'clientCert', 'message':fs.readFileSync(webinos.session.pzp.config.certname).toString()};
			msg = {};
			msg = { register: false,  type: "prop", id: 0,
				from: null, to: null ,
				resp_to: null, timestamp: 0,
				timeout: null, payload: payload};
			webinos.session.pzp.sendMessage(msg);
		} 
		/* It registers with message handler and set methods for message handler. 
		 * It also registers PZH as its client. To enable message to be sent from 
		 * message handler directly. It is responsible for starting server and 
		 * functionality is similar to PZH, except it does not generate certificates 
		 * for connecting PZP. If port is blocked it increments port before connecting.
		 */
		else if (data1.type === 'prop' && data1.payload.status === 'Auth') {
			log('PZP: Authenticated');
			webinos.session.pzp.serverName = data1.from;
			webinos.session.pzp.sessionId = data1.to;
			for (var i = 0 ; i < data1.payload.message.length ; i += 1) {
				webinos.session.pzp.otherPZP.push(data1.payload.message[i]);
			}

			msg = webinos.message.registerSender(webinos.session.pzp.sessionId,webinos.session.pzp.serverName);
			webinos.session.pzp.sendMessage(msg);
			webinos.message.setGet(webinos.session.pzp.sessionId);
			webinos.message.setSend(webinos.session.pzp.sendMessage);
			
			var server = self.startServer();

			server.on('error', function (err) {
				if (err.code == 'EADDRINUSE') {
					log('PZP Server: Address in use');
					self.serverPort = self.serverPort + 1 ;
					server.listen(self.serverPort, servername);
				}
			});

			server.on('listening', function () {
				log('Server PZP: listening as server on port :' + self.serverPort);
			});
				
			server.listen(self.serverPort, servername);
			self.emit('startedPZP', 'client started');
		} // It is signed client certificate by PZH
		else if(data1.type === 'prop' && data1.payload.status === 'signedCert') {
			log('PZP: Creating signed client cert');
			fs.writeFile(webinos.session.pzp.config.certname, data1.payload.message);
		} // It is signiing server certificate of PZH
		else if(data1.type === 'prop' && data1.payload.status === 'signingCert') {
			log('PZP: Creating server signing cert');
			fs.writeFile(webinos.session.pzp.config.mastercertname, data1.payload.message);
			var options2 = {key: fs.readFileSync(webinos.session.pzp.config.keyname),
					cert: fs.readFileSync(webinos.session.pzp.config.certname),
					ca: fs.readFileSync(webinos.session.pzp.config.mastercertname)};

			self.emit('connectPZHAgain',options2);
		} // This is update message about other connected PZP
		else if(data1.type === 'prop' && data1.payload.status === 'PZPUpdate') {
			log('PZP: Update other PZP details') ;
			for (var i = 0 ; i < data1.payload.message.length ; i += 1) {
				if(webinos.session.pzp.sessionId !== data1.payload.message[i])
					webinos.session.pzp.otherPZP.push(data1.payload.message[i]);
			}
			log(webinos.session.pzp.otherPZP);
		}
		// Forward message to message handler
		else { 
			log('PZP: Message Forward to Message Handler' + JSON.stringify(data1));
			webinos.message.onMessageReceived(JSON.stringify(data1));
		}
	});

	client.on('end', function () {
		log('PZP: Connection teminated');
	});
	
	client.on('error', function (err) {
		log('PZP: Error connecting server' + err.stack);	
	});

	client.on('close', function () {
		log('PZP: Connection closed by PZH');
	});
};
// It is replica of PZH. We do not need certificate generation part that's why it is replicated.
pzp.prototype.startServer = function () {
	"use strict";
	var self, i, cn, found, options, clientServer;
	self = this;
	options =  {key: fs.readFileSync(webinos.session.pzp.config.keyname),
			cert: fs.readFileSync(webinos.session.pzp.config.certname),
			ca:fs.readFileSync(webinos.session.pzp.config.mastercertname), 
			requestCert:true, 
			rejectUnauthorized:false
			};;
	clientServer = tls.createServer(options, function (conn) {
		var data = {}, obj;
		if(conn.authorized) {
			log("PZP Server: Authenticated ");
			cn = conn.getPeerCertificate().subject.CN;
			//found = checkClient(self.connected_client, cn);
			//if (found === false) {
			obj = {commonname: webinos.session.pzp.config.common, sessionid: self.sessionid+'::'+cn};
			self.connectedClient.push(obj);
			log('PZP Server: Connected PZP details : ' + JSON.stringify(self.connectedClient));
			//}
			payload = {'status':'Auth', 'message':self.connectedClient};
			msg = {};
			msg = { register: false,  type: "prop", id: 0,
				from:  self.sessionid, to: obj.sessionid,
				resp_to:  self.sessionid, timestamp: 0,
				timeout:  null, payload: payload};
			self.sendMessage(msg);

		} else {
			log("PZP Server: Not Authenticated " + conn.authorizationError);
			payload = {'status':'NotAuth', 'message':''};
			msg = {};
			msg = { register: false,  type: "prop", id: 0,
				from:  self.sessionid, to: null,
				resp_to:  self.sessionid, timestamp: 0,
				timeout:  null, payload: payload};
			self.sendMessage(msg);
		}

		conn.on('secure', function() {
			log('PZP Server: connected secure : ' + conn.remoteAddress);
		});

		conn.on('data', function(data) {
			// Generate client certificate
			log('PZP Server: read bytes = ' + data.length);
			var parse;
			parse = JSON.parse(data);
			webinos.message.onMessageReceived(parse);
		});

		conn.on('end', function() {
			log('PZP Server: end');
		});

		conn.on('close', function() {
			log('PZP Server: socket closed');
			//removeClient(self);
		});

		conn.on('error', function(err) {
			log('PZP Server:' + err + ' error stack : ' + err.stack);
		});
	});
	return clientServer;
};

/* starts pzp, creates client, start servers and event listeners
 * @param server name
 * @param port: port on which PZH is running
 */
webinos.session.pzp.startPZP = function(servername, port) {
	"use strict";
	var client = new pzp();
	client.on('configSet',function(status) {
		log('PZP: client connecting');
		client.connect(status, servername, port);		
	});

	client.on('connectPZHAgain',function(status) {
		log('PZP: client connect again');
		client.connect(status, servername, port);
	});

	client.checkFiles();
	return client;
};

webinos.session.pzp.startWebSocketServer = function(serverPort, webServerPort) {
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
	})
	
	cs.on('error', function(err) {
		if (err.code == 'EADDRINUSE') {
			var x = parseInt(webServerPort) ;
			x += 1;
			webServerPort = x;
			cs.listen(webServerPort,function(){
				log("PZP Web Server: is listening on port "+webServerPort);
			});
		}
	});

	cs.listen(webServerPort,function(){
		log("PZP Web Server: is listening on port "+webServerPort);
	});

	var httpserver = http.createServer(function(request, response) {
		log("PZP Websocket Server: Received request for " + request.url);
		response.writeHead(404);
		response.end();
	});

	httpserver.on('error' , function(err) {
		if (err.code == 'EADDRINUSE') {
			var x = parseInt(serverPort) 
			x += 1;
			serverPort = x;
			httpserver.listen(serverPort,function(){
				log("PZP Websocket Server: is listening on port "+serverPort);
			});
		}
	});

	httpserver.listen(serverPort, function() {
		log("PZP Websocket Server: Listening on port "+serverPort);
		//self.emit('websocket_started','websocket started');
	});

	webinos.session.pzp.wsServer = new WebSocketServer({
		httpServer: httpserver,
		autoAcceptConnections: true
	});

	webinos.session.pzp.wsServer.on('connect', function(connection) {
		log("PZP Websocket Server: Connection accepted.");
		
		
		connection.on('message', function(message) {
			log('PZP websocket server received packet');
			var msg = JSON.parse(message.utf8Data);
			// Each message is forwarded back to Message Handler to forward rpc message
			if(msg.payload.status === 'registerBrowser') {
				var id = webinos.session.pzp.getPZPSessionId()+ '/'+webinos.session.pzp.setServiceSessionId();
				webinos.session.pzp.connected_app[id] = connection;
				var options = {register: false, type: "prop", id: 0,
					from: webinos.session.pzp.getPZPSessionId(), to: id, resp_to: webinos.session.pzp.getPZHSessionId(),
					timestamp: 0, timeout:  null, payload: webinos.session.pzp.getOtherPZP()
				};
				log("PZP Websocket Server: options "+ options);
				webinos.session.pzp.wsServer.broadcastUTF(JSON.stringify(options));
			} else if(msg.type === 'prop' && msg.payload.status === 'startPZH') {
				var server = webinos.session.pzh.startPZH(msg.payload.servername, msg.payload.serverport);
				// Instantiate and connect to other PZH server
				server.on('startedPZH', function() {
					log('PZP WeSocket bServer: started PZH'); 
					webinos.session.pzh.startHttpsServer(msg.payload.httpserver);
				});
			} else if(msg.type === 'prop' && msg.payload.status === 'startPZP') {
				var server = webinos.session.pzp.startPZP(msg.payload.servername, msg.payload.serverport);
				// Instantiate and connect to other PZH server
				server.on('startedPZH', function() {
					log('PZP WebSocket Server: started PZP'); 
				});
			} else {
				webinos.message.onMessageReceived(message.utf8Data, message.utf8Data.to);
			}			
		});
		connection.on('close', function(connection) {
       			log("PZP Websocket Server: Peer " + connection.remoteAddress + " disconnected.");
    		});
	});	
};

if (typeof exports !== 'undefined') {
	exports.startPZP = webinos.session.pzp.startPZP;
 	exports.sendMessage = webinos.session.pzp.sendMessage;
	exports.getPZHSessionId = webinos.session.pzp.getPZHSessionId;
	exports.getPZPSessionId = webinos.session.pzp.getPZPSessionId;
	exports.getServiceSessionId = webinos.session.pzp.getServiceSessionId;
}
}());
