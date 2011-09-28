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

if (webinos.session.pzh !== "undefined") {
	webinos.session.pzh = {};
} 

var log = console.log,
  tls = require('tls'),
  events = require('events'),
  fs = require('fs'),
  dns = require('dns'),
  generator,
  x;

var common = require('./session_common.js');
var clients = []; 

function pzh() {
	"use strict";
	this.config = {};
	this.sessionid = 0;
	this.connected_client = [];
	this.port = 443;// Default port to be used
}

pzh.prototype = new process.EventEmitter();

pzh.prototype.sendMessage = function(message) {
	var socket = ' ', i; 
	for(i = 0; i < clients.length; i += 1) {
		if (clients[i].session === message.to) {
			socket = clients[i].socket;
			break;
		}
	}
	if (socket !== ' ')
		socket.write(JSON.stringify(message));
	else
		log('PZH: socket is null');
};

// Create self signed certificate for PZH 
// openssl genrsa -out server-key.pem
// openssl req -new -key server-key.pem -out server-csr.pem
// openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem
pzh.prototype.checkfiles = function () {
	"use strict";
	var self = this;
	common.readConfig(self);
	self.on('readconfig', function () {
		common.checkFiles(self);
		self.on('selfgencert', function(status) {
			if(status === 'true') {
				common.masterCert(self);	
				log('PZH: generating server certificate signed by master certificate');
				common.generateServerCertifiedCert(fs.readFileSync(self.config.certname).toString(), self.config);
				self.emit('generated', 'file created');
			} else {
				self.emit('generated', 'file present');
			}		
		});
	});
};

pzh.prototype.connect = function () {
	"use strict";
	var i, self, options, server, msg;
	self = this;
	options = common.serverConfig(self.config);
	self.sessionid = common.generateSessionId(self.config.common, options).sessionid; 
	webinos.message.setGet(self.sessionid);
	webinos.message.setSend(self.sendMessage);

	server = tls.createServer (options, function (conn) {
		var data = {}, obj ={}, obj1 = {}, cn, found = false, msg, parse = null, payload = {}, msg = {};

		if(conn.authorized) {
			log("PZH: Client Authenticated ");
			cn = conn.getPeerCertificate().subject.CN;
			found = common.checkClient(self.connected_client, cn);
			// TODO: For development purpose same host can be used to run multiple client. Enabling below lines will remove duplicates
			//if(found === false) {
			obj = common.generateSessionId(cn, options);
			self.connected_client.push(obj);
			obj1 = {'session':obj.sessionid, 'socket':conn};
			clients.push(obj1);

			webinos.message.registerSender(obj.sessionid);
		 	//format: ownid :: client sessionid :: other connected pzp
			payload = {'status':'Auth', 'message':self.connected_client};
			msg = { register: false,  type: "prop", id: 0,
				from:  self.sessionid, to: obj.sessionid,
				resp_to:  self.sessionid, timestamp: 0,
				timeout:  null, payload: payload};
			var message = webinos.message.createMessage(msg);
			self.sendMessage(message);
		} else {
			log("PZH: Not Authenticated " + conn.authorizationError);
			payload = {'status':'NotAuth', 'message':''};
			msg = { register: false,  type: "prop", id: 0,
				from:  self.sessionid, to: null,
				resp_to:  self.sessionid, timestamp: 0,
				timeout:  null, payload: payload};
			self.sendMessage(msg);
		}
		
		conn.on('data', function(data) {
			// Generate client certificate
			log('PZH: read bytes = ' + data.length);
			parse = JSON.parse(data);

			if(parse.type === 'prop') {
				// If we could get this information from within key exchange in openssl, it would not require certificate
				common.generateClientCertifiedCert(data.payload.message, self.config);		
				payload = {'status':'clientcert', 'message':fs.readFileSync(self.config.clientcertname).toString()};
				msg = { register: false,  type: "prop", id: 0,
					from:  self.sessionid, to: obj.sessionid,
					resp_to:  self.sessionid, timestamp: 0,
					timeout:  null, payload: payload};
				self.sendMessage(msg);

				payload = {'status':'servercert', 'message':fs.readFileSync(self.config.mastercertname).toString()};
				msg = { register: false,  type: "prop", id: 0,
					from:  self.sessionid, to: obj.sessionid,
					resp_to:  self.sessionid, timestamp: 0,
					timeout:  null, payload: payload};
				self.sendMessage(msg);

			} else {
				log('PZH: Received data : '+JSON.stringify(parse));
				webinos.message.onMessageReceived(parse, parse.to);
			}
		});

		conn.on('end', function() {
			log('PZH: server connection end');
		});

		conn.on('close', function() {
			log('PZH: socket closed');
			common.removeClient(self);
		});

		conn.on('error', function(err) {
			log('PZH:' + err + ' error stack : ' + err.stack);
		});
	});
	return server;
};
// Input
// arg: server name
webinos.session.pzh.startPZH = function(server, port) {
	"use strict";
	var server = new pzh(), sock, msg;
	server.on('generated',function (status) {
		log('PZH: starting server: ' + status);
		sock = server.connect()	;
		sock.listen(port, server);
	});
	
	
	server.checkfiles();
};

if (typeof exports !== 'undefined') {
	exports.startPZH = webinos.session.pzh.startPZH;
}

}());

