(function() {

if (typeof webinos === "undefined") {
	webinos = {};
}

if (typeof exports !== "undefined") {
	//webinos.message = require("../../PZ/PZP/messaging.js");
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
webinos.session.pzh.connected_pzp = [];
webinos.session.pzh.connected_pzh = [];
// Session id of PZH
//self.sessionid = 0;
// webinos.session.pzh
//self.config = {};

function pzh() {
	"use strict";
	this.sessionid = 0;
	this.config = {};
	
	//this.connected_pzh = [];
	//this.connected_pzp = [];
	
	/*this.sendMessage = function (message, address) {
	"use strict";
	var socket = ' ', i;
	log('PZH: SendMessage to address ' + address + ' Message ' + JSON.stringify(message));
	if (this.connected_pzh[address]) {
		log('PZH: Connected PZH ');
		//webinos.session.pzh.connected_pzh[address].write(JSON.stringify(message));
		this.connected_pzh[address].write(JSON.stringify(message));
	} else if (this.connected_pzp[address]) {
		log('PZH: Connected PZP ');
		//webinos.session.pzh.connected_pzp[address].write(JSON.stringify(message));
		this.connected_pzp[address].write(JSON.stringify(message));
	} else {
		log("PZH: Client " + address + " is not connected");
	}
	};*/
}

/* PZH generates self event to enable message flow between different functions. 
 * This has been done to enable call flow between components
 */
pzh.prototype = new process.EventEmitter();

/*
 * This function is registered with message handler to send message towards rpc. 
 * It searches for correct PZP by looking in connected_pzp. It is searched 
 * based on message to field. webinos.session.pzh.connected_pzh
 * At the moment it uses JSON.stringify to send messages. As we are using objects, 
 * they need to be stringify to be processed at other end of the socket
 * @param Message to send forward
 */
webinos.session.pzh.sendMessage = function(message, address) {
//pzh.prototype.sendMessage = function(message, address) {
	"use strict";
	var socket = ' ', i;
	var self = this;
	log('PZH: SendMessage to address ' + address + ' Message ' + JSON.stringify(message));
	if (webinos.session.pzh.connected_pzh[address]) {
		log('PZH: Connected PZH ');
		webinos.session.pzh.connected_pzh[address].write(JSON.stringify(message));
	} else if (webinos.session.pzh.connected_pzp[address]) {
		log('PZH: Connected PZP ');
		webinos.session.pzh.connected_pzp[address].write(JSON.stringify(message));
	} else {
		log("PZH: Client " + address + " is not connected");
	}
};

/* This is responsible for reading config.txt file. It is based on config.txt file, 
 * certificate names and other information for generating certificate is  fetched. 
 * If certificates are not found, they are generated. The functionality of reading 
 * contents of file and generating certificate is handled in session_common.
*/
pzh.prototype.checkFiles = function (filename) {
	"use strict";
	var self = this;
	webinos.session.common.readConfig(filename, self);
	self.on('readConfig', function (msg) {
		log('PZH: readConfig');
		webinos.session.common.generateSelfSignedCert(self);

		self.on('generatedCert', function(status) {
			if(status === 'true') {
				log('PZH: generating self signed connection certificate');
				webinos.session.common.generateMasterCert(self);	

				log('PZH: generating connection certificate signed by signing certificate');
				webinos.session.common.generateServerCertifiedCert(
					fs.readFileSync(self.config.certname).toString(), 
					self.config);

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
	var ca = [fs.readFileSync(self.config.mastercertname)];
	if (self.config.otherPZHCert !== '')
		ca = [fs.readFileSync(self.config.mastercertname),  fs.readFileSync(self.config.otherPZHCert)];
	// Read server configuration for creating TLS connection
	var options = {	key: fs.readFileSync(self.config.keyname),
			cert: fs.readFileSync(self.config.certname),
			ca:ca,
			requestCert:true, 
			rejectUnauthorized:false
			};
	// PZH session id is the common name assigned to it. In usual scenaio it should be URL of PZH. 
	self.sessionid = self.config.common;
	
	// Registering getownid value in message handler
	webinos.message.setGet(self.sessionid);
	
	// send function to be used by message handler
	webinos.message.setSend(webinos.session.pzh.sendMessage);
//
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
			webinos.session.pzh.connected_pzh[self.sessionid] = conn;
			//self.connected_pzh[self.sessionid] = conn;
			data = cn.split(':');
			// Assumption: PZH is of form username@domain
			// Assumption: PZP is of form username@domain/mobile:Deviceid@mac
			if(data[0].indexOf('@') !== -1 /*&& data[0].indexOf('/') === -1*/) { 
				webinos.session.pzh.connected_pzh[data[0]] = conn;
				var otherPZH = [], myKey;
			 	//format: ownid :: client sessionid :: other connected pzp
				for (myKey in webinos.session.pzh.connected_pzh){
					log("OtherPZH ["+myKey +"] = "+webinos.session.pzh.connected_pzh[myKey]);
					otherPZH.push(myKey);
				}
				var msg1 = { 'type': 'prop', 'from':  self.sessionid, 'to': data[0], 'payload': {'status':'Auth', 'message': otherPZH} };
				webinos.session.pzh.sendMessage(msg1, msg1.to);
				/*var msg = webinos.message.registerSender(self.sessionid, data[0]);
				webinos.session.pzh.sendMessage(msg, data[0]);

				msg = {'type': 'prop', 'from':  self.sessionid, 'payload': {'status':'PZHUpdate', 'message':otherPZP}};
				// send message to all connected PZP and PZH
				for (myKey in webinos.session.pzh.connected_pzh){
					log("PZHUpdate ["+ myKey +"] = "+webinos.session.pzh.connected_pzh[myKey]);
					if(data[0] !== myKey) {
						webinos.session.pzh.connected_pzh[myKey].write(JSON.stringify(msg));;
					}
				}*/
			} else {
				// connected PZP session id is of form PZH::PZP's common name without device id
				sessionId = self.sessionid + "/" + data[0];

				webinos.session.pzh.connected_pzp[sessionId] = conn; 
				var otherPZP = [], myKey;
				for (myKey in webinos.session.pzh.connected_pzp){
					otherPZP.push(myKey);
				}
				msg = { 'type': "prop", 'from':  self.sessionid, 
					'to': sessionId, 'payload': {'status':'Auth', 'message':otherPZP}};
				webinos.session.pzh.sendMessage(msg, sessionId);

				msg = { 'type': "prop", 'from':  self.sessionid, 'payload': {'status':'PZPUpdate', 'message':otherPZP}};
				// send message to all connected PZP and PZH
				for (myKey in webinos.session.pzh.connected_pzp){
					if(sessionId !== myKey)
						webinos.session.pzh.connected_pzp[myKey].write(JSON.stringify(msg));
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
			var msg = {'type': "prop", 'payload': {'status':'NotAuth'}};
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
				// If we could get this setSendinformation from within key exchange in openssl, it would not require certificate
				webinos.session.common.generateClientCertifiedCert(parse.payload.message, self.config);		
				var msg = {'type': 'prop', 'payload': {'status':'signedCert', 'clientCert':(fs.readFileSync(self.config.clientcertname).toString()), 
							'signingCert':(fs.readFileSync(self.config.mastercertname).toString())}};
				conn.write(JSON.stringify(msg));				
			} else { // Message is forwarded to Message handler function, onMessageReceived
				log('PZH: Received data : '+JSON.stringify(parse));
				webinos.message.setGet(self.sessionid);
				webinos.message.setSend(webinos.session.pzh.sendMessage);
				webinos.message.onMessageReceived(JSON.stringify(parse));
			}
		});

		conn.on('end', function() {
			log('PZH: server connection end');
		});

		// It calls removeClient to remove PZP from connected_client and connected_pzp.
		conn.on('close', function() {
			log('PZH: socket closed');
			webinos.session.common.removeClient(webinos.session.pzh.connected_pzp, conn);
		});

		conn.on('error', function(err) {
			log('PZH:' + err.code + '\n PZH: Error stack : ' + err.stack);
		});
	});
	return server;
};

/* starts pzh, creates servers and event listeners for listening data from clients.
 * @param server name
 * @param port: port on which server is running
 */
webinos.session.pzh.startPZH = function(filename, server, port) {
	"use strict";
	var __pzh = new pzh(), sock, msg;
	__pzh.on('generatedSignedCert',function (status) {
		log('PZH: starting server: ' + status);
		sock = __pzh.connect();
		sock.listen(port, server);

		sock.on('listening', function() {
			log('PZH: server listening');
			__pzh.emit('startedPZH', 'PZH started');	
		});		
	});
	
	__pzh.checkFiles(filename);
	return __pzh;
};

//webinos.session.pzh.startHttpsServer = function(args) {
pzh.prototype.startHttpsServer = function(args) {
	var self = this;
	var httpServer = http.createServer(function(request, response) {
		request.on('data', function(data) {
			console.log(data);
		});
    	response.writeHead(200, {'Content-Type': 'text/plain'});
		response.write("You are connected to PZH:" + self.sessionid+ "\n");
		response.end();
	});

	httpServer.listen(args,function(){
		log("PZH HTTPS Server: Listening on port " + args);
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
				webinos.session.pzh.connected_pzh[parse.from] = conn_pzh;
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
	exports.connectOtherPZH = webinos.session.pzh.connectOtherPZH;
	exports.startHttpsServer = webinos.session.pzh.startHttpsServer;
	exports.sendMessage = webinos.session.pzh.sendMessage;
	exports.connected_pzp = webinos.session.pzh.connected_pzp;
	exports.connected_pzh = webinos.session.pzh.connected_pzh;
	//exports.sessionid = self.sessionid;
	//exports.config = self.config;
}

}());