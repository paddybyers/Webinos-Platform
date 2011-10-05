(function() {

if (typeof webinos === "undefined") {
	webinos = {};
}

if (typeof exports !== "undefined") {
	messaging = require("../Messaging/messagehandler.js");
} else {
	messaging = webinos.messaging; 
}

if (webinos.session !== "undefined") {
	webinos.session = {};
} 

if (webinos.session.pzp !== "undefined") {
	webinos.session.pzp = {};
} 

var log = console.log,
  tls = require('tls'),
  events = require('events'),
  fs = require('fs'),
  dns = require('dns'),
  generator,
  x;

var common = require('./session_common.js');

// This requires Manager/Session to be compiled before this file is available
x = process.version;
x = x.split('.');
if ( x[1] >= 5) {
	generator = require('./build/Release/generator.node');
} else {
	generator = require('./build/default/generator.node');
}

var clientSocket = {};
webinos.session.pzp = function() {
	"use strict";
	this.config = {};
	this.servername = [];
	this.sessionid = 0;
	this.connected_client = [];
	this.port = 443;
	
	this.serverPort = 8181;
	this.serversession = [];
	this.otherPZP = [];
}

webinos.session.pzp.prototype = new process.EventEmitter();

webinos.session.pzp.prototype.getId = function () {
	return this.sessionid;
};

webinos.session.pzp.prototype.getServerName = function() {
	return this.servername;
};

webinos.session.pzp.prototype.getServerSession = function() {
	return this.serversession;
};

webinos.session.pzp.prototype.getOtherPZPInfo = function() {
	var i;
	for(i = 0; i < this.otherPZP.length; i++) {
		if (this.otherPZP[i].sessionid === this.sessionid) {
			continue;
		} else {
			return this.otherPZP[i].sessionid;
		}
	}
		
};

webinos.session.pzp.prototype.sendMessage = function(message) {
	clientSocket.write(JSON.stringify(message));
};

webinos.session.pzp.prototype.checkfiles = function () {
	"use strict";
	var self, options1, options2;
	self = this;
	common.readConfig(self);
	self.on('readconfig',function () {
		common.checkFiles(self);
		self.on('selfgencert', function(status) {
			if(status === 'true') {
				options1 = {
					key: fs.readFileSync(self.config.keyname),
					cert: fs.readFileSync(self.config.certname)
				};
				self.emit('generated',options1);
			} else {
 				options2 = {
					key: fs.readFileSync(self.config.keyname),
					cert: fs.readFileSync(self.config.certname),
					ca: fs.readFileSync(self.config.mastercertname)
				};
				self.emit('generated', options2);
			}
		});
	});	
};

webinos.session.pzp.prototype.connect = function (options, servername, port) {
	"use strict";
	var self, client;
	self = this;
	client = tls.connect(port, servername, options, function(conn) {
		log('PZP: connect status: ' + client.authorized);
		clientSocket = client;
	});

	client.on('data', function(data) {
		log('PZP: data received : ' + data.length);
		var data1, send;
		data1 = JSON.parse(data);
		log('PZP:'+JSON.stringify(data1));

		if (data1.type === 'prop' && data1.payload.status === 'NotAuth') {
			log('PZP: Not Authenticated');
			payload = {'status':'clientcert', 'message':fs.readFileSync(self.config.certname).toString()};
			msg = { register: false,  type: "prop", id: 0,
				from: null, to: null ,
				resp_to: null, timestamp: 0,
				timeout: null, payload: payload};
			self.sendMessage(msg);
		} else if (data1.type === 'prop' && data1.payload.status === 'Auth') {
			log('PZP: Authenticated');
			self.servername=client.getPeerCertificate().subject.CN;
		
			self.serversession = data1.from;
			self.sessionid= data1.to;
			self.otherPZP = data1.payload.message;

			//webinos.message.registerSender(self.sessionid);
			webinos.message.setGet(self.sessionid);
			webinos.message.setSend(self.sendMessage);
			
			var server = self.startServer();
			server.listen(self.serverPort, servername);
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
			self.emit('started', 'client started');
		} else if(data1.type === 'prop' && data1.payload.status === 'clientcert') {
			log('PZP: creating client cert');
			fs.writeFile(self.config.certname, data1.message);
		} else if(data1.type === 'prop' && data1.payload.status === 'servercert') {
			log('PZP: creating server cert');
			fs.writeFile(self.config.mastercertname, data1.message);
			var options2 = {key: fs.readFileSync(client.config.keyname),
				cert: fs.readFileSync(client.config.certname),
				ca: fs.readFileSync(client.config.mastercertname)};

			self.emit('connect_again',options2);
		} else { 
			log('PZP: Message Received' + JSON.stringify(data1));
			//if(data1.message.to === self.sessionid) {
			//	log('PZP: '+ data1.message );
			//} else {
				webinos.message.onMessageReceived(data1);
			//}
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

webinos.session.pzp.prototype.startServer = function () {
	"use strict";
	var self, i, cn, found, options, clientServer;
	self = this;
	options = common.serverConfig(self.config);
	clientServer = tls.createServer(options, function (conn) {
		var data = {}, obj;
		if(conn.authorized) {
			log("PZP Server: Authenticated ");
			// This is a session id created randomly of size 80 
			// Each TLS connection in openssl has a session id but there accessing this id through node.js is not possible, so we create our own
			cn = conn.getPeerCertificate().subject.CN;
			found = checkClient(self.connected_client, cn);

			//if (found === false) {
			obj = generateSessionId(cn, options); 
			self.connected_client.push(obj);
			log('PZP Server: Connected PZP details : ' + JSON.stringify(self.connected_client));
			//}
			payload = {'status':'Auth', 'message':self.connected_client};
			msg = { register: false,  type: "prop", id: 0,
				from:  self.sessionid, to: obj.sessionid,
				resp_to:  self.sessionid, timestamp: 0,
				timeout:  null, payload: payload};
			self.sendMessage(msg);

		} else {
			log("PZP Server: Not Authenticated " + conn.authorizationError);
			payload = {'status':'NotAuth', 'message':''};
			msg = { register: false,  type: "prop", id: 0,
				from:  self.sessionid, to: obj.sessionid,
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
			if (parse.type === 'JSONRPC')	{
				webinos.message.onMessageReceived(parse);
			}	
		});

		conn.on('end', function() {
			log('PZP Server: end');
		});

		conn.on('close', function() {
			log('PZP Server: socket closed');
			removeClient(self);
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
	var client = new webinos.session.pzp();
	client.on('generated',function(status) {
		log('PZP: client connecting');
		client.connect(status, servername, port);		
	});

	client.on('connect_again',function(status) {
		log('PZP: client connect again');
		client.connect(status, servername, port);
	});

	client.checkfiles();
	return client;
};

if (typeof exports !== 'undefined') {
	exports.pzp = webinos.session.pzp;
	exports.startPZP = webinos.session.pzp.startPZP;
 	//exports.getOwnId = webinos.session.pzp.getOwnId; 
 	//exports.getServerName = webinos.session.pzp.getServerName; 
 	//exports.sendMessage = webinos.session.pzp.sendMessage; 
}
}());
