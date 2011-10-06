(function() {

if (typeof webinos === "undefined") {
	webinos = {};
}

if (typeof exports !== "undefined") {
	webinos.message = require("../Messaging/messaging.js");
} 
if (webinos.session !== "undefined") {
	webinos.session = {};
} 

if (webinos.session.pzp !== "undefined") {
	webinos.session.pzp = {};
}
 
if(webinos.session.common !== "undefined") {
	webinos.session.common = require('./session_common.js')
}

var log = console.log,
  tls = require('tls'),
  events = require('events'),
  fs = require('fs'),
  dns = require('dns');


pzp = function() {
	"use strict";
	this.config = {};
	this.serverPort = 8181;
}

webinos.session.pzp.clientSocket = {};
webinos.session.pzp.serverName = [];
webinos.session.pzp.sessionId = 0;
webinos.session.pzp.serviceSessionId = 0;
webinos.session.pzp.connectedClient = [];
webinos.session.pzp.otherPZP = [];
webinos.session.pzp.connected_app = {};

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

webinos.session.pzp.sendMessage = function(message) {
	var i;
	log(message);
	if(webinos.session.pzp.connected_app[message.to]) { 	// it should be for the one of the apps connected.
		log("PZP: Message forwarded to one of the connected app on websocket server ");
		conn = webinos.session.pzp.connected_app[message.to];
		conn.sendUTF(JSON.stringify(message));
	} else {
		// This is for communicating with PZH
		webinos.session.pzp.clientSocket.write(JSON.stringify(message));
	}	
};

webinos.session.pzp.getOtherPZP = function() {
	var i;
	for ( i = 0; i < webinos.session.pzp.otherPZP.length; i += 1) {
		if (webinos.session.pzp.otherPZP[i].sessionid === webinos.session.pzp.sessionId)
			continue;
		else
			return webinos.session.pzp.otherPZP[i].sessionid;
	}
};

pzp.prototype.checkfiles = function () {
	"use strict";
	var self, options;
	self = this;
	webinos.session.common.readConfig(self);
	self.on('readConfig',function () {
		webinos.session.common.checkFiles(self);
		self.on('generatedCert', function(status) {
			if(status === 'true') {
				options = {
					key: fs.readFileSync(self.config.keyname),
					cert: fs.readFileSync(self.config.certname)
				};
				self.emit('configSet',options);
			} else {
 				options = {
					key: fs.readFileSync(self.config.keyname),
					cert: fs.readFileSync(self.config.certname),
					ca: fs.readFileSync(self.config.mastercertname)
				};
				self.emit('configSet', options);
			}
		});
	});	
};

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
		log('PZP:'+JSON.stringify(data1));

		if (data1.type === 'prop' && data1.payload.status === 'NotAuth') {
			log('PZP: Not Authenticated');
			payload = {'status':'clientCert', 'message':fs.readFileSync(self.config.certname).toString()};
			msg = {};
			msg = { register: false,  type: "prop", id: 0,
				from: null, to: null ,
				resp_to: null, timestamp: 0,
				timeout: null, payload: payload};
			webinos.session.pzp.sendMessage(msg);

		} else if (data1.type === 'prop' && data1.payload.status === 'Auth') {
			log('PZP: Authenticated');
			webinos.session.pzp.serverName = data1.from;
			webinos.session.pzp.sessionId = data1.to;
			webinos.session.pzp.otherPZP = data1.payload.message;

			webinos.message.registerSenderClient(webinos.session.pzp.serverName);
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
		} else if(data1.type === 'prop' && data1.payload.status === 'signedCert') {
			log('PZP: creating signed client cert');
			fs.writeFile(self.config.certname, data1.payload.message);
		} else if(data1.type === 'prop' && data1.payload.status === 'signingCert') {
			log('PZP: creating server signing cert');
			fs.writeFile(self.config.mastercertname, data1.payload.message);
			var options2 = {key: fs.readFileSync(self.config.keyname),
					cert: fs.readFileSync(self.config.certname),
					ca: fs.readFileSync(self.config.mastercertname)};

			self.emit('connectPZHAgain',options2);
		} else { 
			log('PZP: Message Received' + JSON.stringify(data1));
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

pzp.prototype.startServer = function () {
	"use strict";
	var self, i, cn, found, options, clientServer;
	self = this;
	options = webinos.session.common.serverConfig(self.config);
	clientServer = tls.createServer(options, function (conn) {
		var data = {}, obj;
		if(conn.authorized) {
			log("PZP Server: Authenticated ");
			cn = conn.getPeerCertificate().subject.CN;
			//found = checkClient(self.connected_client, cn);
			//if (found === false) {
			obj = {commonname: self.config.common, sessionid: self.sessionid+'::'+cn};
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

// This function performs function equivalent to below commands
// openssl genrsa -out client-key.pem
// openssl req -new -key client-key.pem -out client-csr.pem
// openssl x509 -req -days 30 -in client-csr.pem -CA ../PZH/server-cert.pem -CAkey ../PZH/server-key.pem -CAcreateserial -out client-cert.pem
// cp ../PZH/server-cert.pem .
// openssl verify -CAfile server-cert.pem client-cert.pem  
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

	client.checkfiles();
	return client;
};

if (typeof exports !== 'undefined') {
	exports.startPZP = webinos.session.pzp.startPZP;
 	exports.sendMessage = webinos.session.pzp.sendMessage;
	exports.getPZHSessionId = webinos.session.pzp.getPZHSessionId;
	exports.getPZPSessionId = webinos.session.pzp.getPZPSessionId;
	exports.getServiceSessionId = webinos.session.pzp.getServiceSessionId;
}
}());
