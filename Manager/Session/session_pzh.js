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

function pzh() {
	"use strict";
	this.config = {};
	this.connected_client = [];
	this.port = 443;// Default port to be used
}

pzh.prototype = new process.EventEmitter();

pzh.prototype.readConfig = function () {
	"use strict";
	var self = this;
	fs.readFile('config.txt', function (err, data) {
		if (err) {
			throw err;
		}
		var data1 = data.toString().split('\n'), i;
		for (i = 0; i < data1.length; i += 1) {
			data1[i] = data1[i].split('=');
		}
		for (i = 0; i < data1.length; i += 1) {
			if (data1[i][0] === 'country') {
				self.config.country = data1[i][1];
			} else if (data1[i][0] === 'state') {
				self.config.state = data1[i][1];
			} else if (data1[i][0] === 'city') {
				self.config.city = data1[i][1];
			} else if (data1[i][0] === 'organization') {
				self.config.orgname = data1[i][1];
			} else if (data1[i][0] === 'organizationUnit') {
				self.config.orgunit = data1[i][1];
			} else if (data1[i][0] === 'common') {
				self.config.common = data1[i][1];
			} else if (data1[i][0] === 'email') {
				self.config.email = data1[i][1];
			} else if (data1[i][0] === 'days') {
				self.config.days = data1[i][1];
			} else if (data1[i][0] === 'keyName') {
				self.config.keyname = data1[i][1];
			} else if (data1[i][0] === 'keySize') {
				self.config.keysize = data1[i][1];
			} else if (data1[i][0] === 'certName') {
				self.config.certname = data1[i][1];
			} else if (data1[i][0] === 'clientCertName') {
				self.config.clientcertname = data1[i][1];
			} else if (data1[i][0] === 'masterKeyName') {
				self.config.masterkeyname = data1[i][1];
			} else if (data1[i][0] === 'masterKeySize') {
				self.config.masterkeysize = data1[i][1];
			} else if (data1[i][0] === 'masterCertName') {
				self.config.mastercertname = data1[i][1];
			}
		}
		self.emit('configread', 'config read');
	});
};

// Create self signed certificate for PZH 
// openssl genrsa -out server-key.pem
// openssl req -new -key server-key.pem -out server-csr.pem
// openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem
pzh.prototype.checkfiles = function () {
	"use strict";
	var self = this;
	self.readConfig();
	self.on('configread', function () {
		fs.readFile(self.config.keyname, function (err) {
			if (err) {
				log('PZH: generating server key');
				// Bits for key to be generated | KeyName
				generator.genPrivateKey(self.config.keysize, self.config.keyname);
				log('PZH: generating server cert');
				// Country, State, City, OrgName, OrgUnit, Common, Email, Days, CertificateName
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
				log('PZH: generating master server key');
				// Bits for key to be generated | KeyName
				generator.genPrivateKey(self.config.masterkeysize, self.config.masterkeyname);
				log('PZH: generating server cert');
				// Country, State, City, OrgName, OrgUnit, Common, Email, Days, CertificateName
				self.config.common = 'MasterCert:' + self.config.common;
				generator.genSelfSignedCertificate(self.config.country,
						self.config.state,
						self.config.city,
						self.config.orgname,
						self.config.orgunit,
						self.config.common,
						self.config.email,
						self.config.days,
						self.config.mastercertname,
						self.config.masterkeyname);
				var servercert = fs.readFileSync(self.config.certname).toString();

				log('PZH: generating server certificate signed by master certificate');
				generator.genCertifiedCertificate(servercert,
							self.config.days,
							self.config.certname,
							self.config.mastercertname,
							self.config.masterkeyname,
							function (err) {
								log('PZH: Error in generating certificate' + err);
							});
				self.emit('checked', 'file created');
			} else {
				self.emit('checked', 'file present');
			}
		});
	});
};

pzh.prototype.send = function (message, sessionid) {
	var data = {'status':'Auth',
		'clientcert':'',
		'servercert':'',
		'message':message,
		'sessionid':sessionid};

	conn.write(data);
};

pzh.prototype.connect = function () {
	"use strict";
	var i, self, options, server;
	self = this;
	options = {
		key: fs.readFileSync(self.config.keyname),
		cert: fs.readFileSync(self.config.certname),
		ca: fs.readFileSync(self.config.mastercertname), // This is self signed certificate, so PZH is its own CA
		requestCert:true, // This field controls whether client certificate will be fetched for mutual authentication
		requestUnauthorized:false
		};

	server = tls.createServer (options, function (conn) {
		var data, cn, found = false;
		data = {};
		if(conn.authorized) {
			log("PZH: Authenticated ");
			data = {'status':'Auth',
				'message':'',
				'sessionid':''};
			// This is a session id created randomly of size 80
			// Each TLS connection in openssl has a session id but there accessing this id through node.js is not possible, so we create our own
			cn = conn.getPeerCertificate().subject.CN;
			for(i = 0; i < self.connected_client.length; i += 1) {
				if(self.connected_client[i].commonname === cn) {
					found = true;
					break;
				}
			}
			if(found === false) {
				var temp, obj, id;
				obj = {};
				obj.commonname=cn;
				obj.sessionid=obj.commonname+':';
				temp = options.cert.toString();
				for(i = 0; i < (40 - obj.commonname.length -1); i += 1) {
					id = Math.floor(Math.random() * options.cert.length);
					if (temp.substring(id, id+1) === ' ') { 
						i -= 1;
						continue;
					}					
					obj.sessionid+=temp.substring(id, id+1);
				}
				self.connected_client.push(obj);
				log('PZH:'+JSON.stringify(self.connected_client));
				message.registerSender(self.connected_client.commonname);
			}
			conn.write(JSON.stringify(data));
		} else {
			log("PZH: Not Authenticated " + conn.authorizationError);
			data = {'status':'NotAuth',
				'message':'', 
				'sessionid':''};

			conn.write(JSON.stringify(data));
		}
		conn.on('data', function(data) {
			// Generate client certificate
			log('PZH: read bytes = ' + data.length);
			var parse = JSON.parse(data);
			if(parse.clientcert) {
				// If we could get this information from within key exchange in openssl, it would not require certificate
				generator.genCertifiedCertificate(parse.clientcert,
							self.config.days,
							self.config.clientcertname,
							self.config.mastercertname,
							self.config.masterkeyname,
							function(err) {
								log('PZH: Certificate generation error' + err);
							});
				
				fs.readFileSync(self.config.mastercertname).toString();
				data={ 'status':'clientcert',
					'message':fs.readFileSync(self.config.clientcertname).toString(),
					'sessonid':''};

				conn.write(JSON.stringify(data));
				data = { 'status':'servercert',
					'message':fs.readFileSync(self.config.mastercertname).toString(),
					'sessionid':''
				};
			}
			if(parse.message) {
				webinos.message.setSend(pzh.send);
				webinos.message.setGet(self.config.common);
				webinos.message.onMessageReceived(parse.message, parse.sessionid);
			}
		});
		conn.on('end', function() {
			log('PZH: end');
		});
		conn.on('close', function() {
			log('PZH: socket closed');
			for(i = 0; i < self.connected_client.length; i += 1) {
				if(self.connected_client[i].commonname === self.config.common) {
					self.connected_client.pop(self.connected_client[i]);
					break;
				}
			}
		});
		conn.on('error', function(err) {
			log('PZH:' + err + ' error stack : ' + err.stack);
		});
	});
	return server;
};

webinos.session.pzh.startPZH = function (arg) {
	"use strict";
	var server = new pzh();
	server.on('checked',function (status) {
		log('PZH: starting server');
		var sock = server.connect();
		sock.listen(server.port,arg);
	});
	server.checkfiles();
};

if (typeof exports !== 'undefined') {
	exports.startPZH = webinos.session.pzh.startPZH;
}

}());

