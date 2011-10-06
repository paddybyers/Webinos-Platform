(function() {

if (typeof webinos === "undefined") {
	webinos = {};
}

if (typeof exports !== "undefined") {
	messaging = require("../Messaging/messaging.js");
} else {
	messaging = webinos.messaging; 
}

if (webinos.session !== "undefined") {
	webinos.session = {};
}

if (webinos.session.pzh !== "undefined") {
	webinos.session.pzh = {};
}

if(webinos.session.common !== "undefined") {
	webinos.session.common = require('./session_common.js');	 
}

// Global variables and node modules that are required
var log = console.log,
	tls = require('tls'),
	events = require('events'),
	fs = require('fs'),
	dns = require('dns'), 
	crypto = require('crypto');
 
// This is global as sendMessage will be called by messaginghandler.js
//??
webinos.session.pzh.connected_pzp = [];

// pzh 
function pzh() {
	"use strict";
	this.config = {};
	this.sessionid = 0;
	this.connected_client = [];
	this.connected_pzh = [];
//	this.connected_pzp = []; 
}

// PZH generates event to enable message flow between different components
pzh.prototype = new process.EventEmitter();

// PZH sendMessage 
webinos.session.pzh.sendMessage = function(message) {
	"use strict";
	var socket = ' ', i;
	var self = this; 
	for(i = 0; i < webinos.session.pzh.connected_pzp.length; i += 1) {
		if (webinos.session.pzh.connected_pzp[i].session === message.to) {
			socket = webinos.session.pzh.connected_pzp[i].socket;
			break;
		}
	}
	if (socket !== ' ')
		socket.write(JSON.stringify(message));
	else
		log('PZH: socket is null');
};

/* Create self signed certificate for PZH. It performs functionality
 * 1. openssl genrsa -out server-key.pem
 * 2. openssl req -new -key server-key.pem -out server-csr.pem
 * 3. openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem
 * 
 */
pzh.prototype.checkfiles = function () {
	"use strict";
	var self = this;
	webinos.session.common.readConfig(self);
	self.on('readConfig', function (msg) {
		log('PZH: '+ msg);
		webinos.session.common.checkFiles(self);

		self.on('generatedCert', function(status) {
			if(status === 'true') {
				log('PZH: generating self signed connection certificate');
				webinos.session.common.masterCert(self);	

				log('PZH: generating connection certificate signed by signing certificate');
				webinos.session.common.generateServerCertifiedCert(fs.readFileSync(self.config.certname).toString(), self.config);

				self.emit('generatedSignedCert', 'signing and connection certificates created');
			} else {
				self.emit('generatedSignedCert', 'certificates present');
			}		
		});
	});
};

pzh.prototype.connect = function () {
	"use strict";
	var i, self, options, server, msg;
	self = this;

	// Read server configuration for creating TLS connection
	options = webinos.session.common.serverConfig(self.config);

	// sessionid is the common name. 	
	self.sessionid = self.config.common; 
	webinos.message.setGet(self.sessionid);
	webinos.message.setSend(webinos.session.pzh.sendMessage);

	server = tls.createServer (options, function (conn) {
		var data = {}, obj = {}, cn, found = false, msg, parse = null, payload = {}, msg = {};		
		if(conn.authorized) {
			log("PZH: Client Authenticated ");
			cn = conn.getPeerCertificate().subject.CN;

			// TODO: For development purpose same host can be used to run multiple client. Enabling below lines will remove duplicates
			//found = common.checkClient(self.connected_client, cn);
			//if(found === false) {
			var sessionId = self.sessionid + "::" + cn;
			obj = {commonname: cn, sessionid: sessionId};
			self.connected_client.push(obj);

			webinos.session.pzh.connected_pzp.push({'session':obj.sessionid, 'socket':conn});
			webinos.message.registerSenderClient(obj.sessionid);

		 	//format: ownid :: client sessionid :: other connected pzp
			payload = {'status':'Auth', 'message':self.connected_client};
			msg = { register: false,  type: "prop", id: 0,
				from:  self.sessionid, to: obj.sessionid,
				resp_to:  self.sessionid, timestamp: 0,
				timeout:  null, payload: payload};
			webinos.session.pzh.sendMessage(msg);
		} else {
			log("PZH: Not Authenticated " + conn.authorizationError);
			payload = {'status':'NotAuth', 'message':''};
			msg = { register: false,  type: "prop", id: 0,
				from:  self.sessionid, to: null,
				resp_to:  self.sessionid, timestamp: 0,
				timeout:  null, payload: payload};
			conn.write(JSON.stringify(msg)); // This is special case as client is not listed in the connected_pzp list	
		}
		
		conn.on('connection', function(socket) {
			log('PZH: connection');
		});
		
		conn.on('data', function(data) {
			// Generate client certificate
			log('PZH: read bytes = ' + data.length);
			parse = JSON.parse(data);

			if(parse.type === 'prop' && parse.payload.status === 'clientCert' ) {
				// If we could get this information from within key exchange in openssl, it would not require certificate
				webinos.session.common.generateClientCertifiedCert(parse.payload.message, self.config);		
				payload = {'status':'signedCert', 'message':fs.readFileSync(self.config.clientcertname).toString()};
				msg = {};
				msg = { register: false,  type: "prop", id: 0,
					from:  self.sessionid, to: obj.sessionid,
					resp_to:  self.sessionid, timestamp: 0,
					timeout:  null, payload: payload};
				conn.write(JSON.stringify(msg));

				payload = {'status':'signingCert', 'message':fs.readFileSync(self.config.mastercertname).toString()};
				msg = {};
				msg = { register: false,  type: "prop", id: 0,
					from: self.sessionid, to: obj.sessionid,
					resp_to: self.sessionid, timestamp: 0,
					timeout: null, payload: payload};
				conn.write(JSON.stringify(msg));

			} else if (parse.type === 'prop' && parse.payload.status === 'otherPZHCert') {
				//fs.writeFile(self.config.certname, data1.payload.message);
				try{
					log(parse.payload.message);
					var ca1 = [parse.payload.message, fs.readFileSync('master-server-cert.pem')];
					server.addContext('localhost',{ca:ca1});
					log(server.ca.toString());
				} catch (err){
					log('did not work');
				}
				
				payload = {'status':'storedCACert', 'message':''};
				msg = {};
				msg = { register: false,  type: "prop", id: 0,
					from: self.sessionid, to: null,
					resp_to: self.sessionid, timestamp: 0,
					timeout: null, payload: payload};
				conn.write(JSON.stringify(msg));	
			} else {
				log('PZH: Received data : '+JSON.stringify(parse));
				webinos.message.onMessageReceived(JSON.stringify(parse), parse.to);
			}
		});

		conn.on('end', function() {
			log('PZH: server connection end');
		});

		conn.on('close', function() {
			log('PZH: socket closed');
			webinos.session.common.removeClient(self, conn);
		});

		conn.on('error', function(err) {
			log('PZH:' + err + ' error stack : ' + err.stack);
		});
	});
	return server;
};

/* starts pzh, creates servers and event listeners for listening data from clients.
 * @param server name
 * @param port: port on which server is running
 */
webinos.session.pzh.startPZH = function(server, port) {
	"use strict";
	var server = new pzh(), sock, msg;
	server.on('generatedSignedCert',function (status) {
		log('PZH: starting server: ' + status);
		sock = server.connect()	;
		sock.listen(port, server);

		sock.on('listening', function() {
			log('PZH: server listening');
			server.emit('startedPZH', 'PZH started');	
		});		
	});
	
	server.checkfiles();
	return server;
};

webinos.session.pzh.connectOtherPZH = function(server, port, details) {
	var conn_pzh = tls.connect(port, server, details, function(conn) {
		log(conn_pzh);
		if(conn_pzh.authorized) {
			log('PZH: Connected to:'+conn_pzh.remoteAddress());
		} else {
			// TODO: Add Authorised step
			var payload = {}, msg ={};
			payload = {'status':'otherPZHCert', 'message':fs.readFileSync('master-server-cert.pem').toString()};
			msg = {};
			msg = { register: false,  type: "prop", id: 0,
				from: null, to: null, // here pzh address should be added
				resp_to: null, timestamp: 0,
				timeout: null, payload: payload};
				conn_pzh.write(JSON.stringify(msg));
		}

		conn_pzh.on('data', function(data) {
			parse = JSON.parse(data);
			log(parse);
			if(parse.payload.status ===  'storedCACert'){
				details  = {key: fs.readFileSync('server-key.pem'),
					cert: fs.readFileSync('server-cert.pem'),
					ca: fs.readFileSync('master-server-cert.pem')};
				webinos.session.pzh.connectOtherPZH(server, port, details);
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
	exports.connectOtherPZH = webinos.session.pzh.connectOtherPZH;
	exports.connected_pzp = webinos.session.pzh.connected_pzp;
}

}());

