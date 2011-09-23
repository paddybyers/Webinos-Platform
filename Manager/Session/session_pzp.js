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

// This requires Manager/Session to be compiled before this file is available
x = process.version;
x = x.split('.');
if ( x[1] >= 5) {
	generator = require('./build/Release/generator.node');
} else {
	generator = require('./build/default/generator.node');
}


function pzp() {
	"use strict";
	this.config = {};
	this.servername = [];
	this.connected_client = [];
	this.port = 443;
	this.serverPort = 8181;
}

pzp.prototype = new process.EventEmitter();

pzp.prototype.readConfig = function () {
	"use strict";
	var self = this;
	fs.readFile('config.txt', function (err , data){
		if (err) {
			throw err;
		}
		var i, data1 = data.toString().split('\n');

		for(i = 0; i < data1.length; i += 1) {
			data1[i] = data1[i].split('=');
		}

		for(i = 0; i < data1.length; i += 1)
		{
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
				self.config.common = data1[i][1];
			} else if(data1[i][0] === 'email') {
				self.config.email = data1[i][1];
			} else if(data1[i][0] === 'days') {
				self.config.days = data1[i][1];
			} else if(data1[i][0] === 'keyName') {
				self.config.keyname = data1[i][1];
			} else if(data1[i][0] === 'keySize') {
				self.config.keysize = data1[i][1];
			} else if(data1[i][0] === 'certName') {
				self.config.certname = data1[i][1];
			} else if(data1[i][0] === 'caName') {
				self.config.caname = data1[i][1];
			}
		}
		self.emit('configread','config read');
	});
};

pzp.prototype.checkfiles = function () {
	"use strict";
	var self, options1, options2;
	self = this;
	self.readConfig();
	self.on('configread',function () {
		fs.readFile(self.config.keyname, function (err) {
			if (err) {
				log('PZP: generating client key');
				// Bits for key to be generated | KeyName
				generator.genPrivateKey(self.config.keysize, self.config.keyname);

				log('PZP: generating client cert');
				generator.genSelfSignedCertificate(self.config.country,
					self.config.state,
					self.config.city,
					self.config.orgname,
					self.config.orgunit,
					self.config.common,
					self.config.email,
					self.config.days,
					self.config.certname,
					self.config.keyname);

				options1 = {
					key: fs.readFileSync(self.config.keyname),
					cert: fs.readFileSync(self.config.certname)
				};
				self.emit('checked',options1);
			}
			else {
				options2 = {
					key: fs.readFileSync(self.config.keyname),
					cert: fs.readFileSync(self.config.certname),
					ca: fs.readFileSync(self.config.caname)
				};
				self.emit('checked', options2);
			}
		});
	});
};

pzp.prototype.connect = function (options, arg) {
	"use strict";
	var self, client;
	self = this;

	client = tls.connect(self.port, arg, options, function(conn) {
		log('PZP: connect status: ' + client.authorized);
	});

	client.on('data', function(data) {
		log('PZP: data received : ' + data);
		var data1, send;
		data1 = JSON.parse(data);
		if (data1.status === 'NotAuth') {
			log('PZP: NotAuth');
			send = {'clientcert': fs.readFileSync(self.config.certname).toString()};
			client.write(JSON.stringify(send));
		} else if (data1.status === 'Auth') {
			log('PZP: Authenticated');
			self.servername=client.getPeerCertificate().subject.CN;
			var server = self.startServer();
			server.listen(self.serverPort, arg);
			server.on('error', function (err) {
				if (err.code == 'EADDRINUSE') {
					log('PZP Server: Address in use');
					self.serverPort = self.serverPort + 1 ;
					server.listen(self.serverPort, arg);
				}
			});
			server.on('listening', function () {
				log('Server PZP: listening as server on port :' + self.serverPort);
			});

		}

		if(data1.clientcert !== "") {
			log('PZP: creating client cert');
			fs.writeFile(self.config.certname, data1.clientcert);
		}

		if(data1.servercert !== "") {
			log('PZP: creating server cert');
			fs.writeFile(self.config.caname, data1.servercert);
			self.emit('connect_again','connect');
		}
	});

	client.on('end', function () {
		log('PZP: Data End');
	});
	
	client.on('error', function (err) {
		log('PZP: server connecting error');	
	});

	client.on('close', function () {
		log('PZP: server close ');
	});
};

pzp.prototype.startServer = function () {
	"use strict";
	var self, i, cn, found, options, clientServer;
	self = this;
	options = {
		key: fs.readFileSync(self.config.keyname),
		cert: fs.readFileSync(self.config.certname),
		ca: fs.readFileSync(self.config.caname), // This is self signed certificate, so PZH is its own CA
		requestCert:true, // This field controls whether client certificate will be fetched for mutual authentication
		requestUnauthorized:false
	};

	clientServer = tls.createServer(options, function (conn) {
		var data = {};
		if(conn.authorized) {
			log("PZP Server: Authenticated ");
			data = {'status':'Auth',
				'clientcert':'',
				'servercert':''};

			// This is a session id created randomly of size 80 
			// Each TLS connection in openssl has a session id but there accessing this id through node.js is not possible, so we create our own
			cn = conn.getPeerCertificate().subject.CN;
			found = false;
			// This code is needed but for development purpose it is currently commented
			for(i = 0; i < self.connected_client.length; i += 1) {
				if(self.connected_client[i].commonname === cn) {
					found = true;
					break;
				}
			}

			if (found === false) {
				var temp, obj, id;
				obj = {};
				obj.commonname=cn;
				obj.sessionid=obj.commonname+':';
				temp = options.cert.toString();
				for(i = 0; i < (80 - obj.commonname.length -1); i += 1) {
					id = Math.floor(Math.random() * options.cert.length);
					obj.sessionid+=temp.substring(id, id+1);
				}
				self.connected_client.push(obj);
				log('PZP Server: Connected PZP details : ' + JSON.stringify(self.connected_client));
			}
			conn.write(JSON.stringify(data));
		} else {
			log("PZP Server: Not Authenticated " + conn.authorizationError);
			data = {'status':'NotAuth',
				'clientcert':'',
				'servercert':''};
			conn.write(JSON.stringify(data));
		}

		conn.on('secure', function() {
			log('PZP Server: connected secure : ' + conn.remoteAddress);
		});

		conn.on('data', function(data) {
			// Generate client certificate
			log('PZP Server: read bytes = ' + data.length);
			var parse;
			parse = JSON.parse(data);
			log('PZP Server: Received data ' + parse);
			conn.write(JSON.stringify(data));
		});

		conn.on('end', function() {
			log('PZP Server: end');
		});

		conn.on('close', function() {
			log('PZP Server: socket closed');
			for(i = 0; i < self.connected_client.length; i += 1) {
				if(self.connected_client[i].commonname === self.config.common) {
					self.connected_client.pop(self.connected_client[i]);
					break;
				}
			}
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
webinos.session.pzp.startPZP = function(arg) {
	"use strict";
	var client = new pzp();
	client.on('checked',function(status) {
		log('PZP: client connecting');
		client.connect(status, arg);
	});

	client.on('connect_again',function(status) {
		log('PZP: client connect again' + status);
		client.checkfiles();
	});

	client.checkfiles();
};

if (typeof exports !== 'undefined') {
	exports.startPZP = webinos.session.pzp.startPZP; 
}
}());
