var  fs = require('fs'),
	x,
	generator;

x = process.version;
x = x.split('.');
if ( x[1] >= 5) {
	generator = require('./build/Release/generator.node');
} else {
	generator = require('./build/default/generator.node');
}

exports.readConfig = function (self) {
	fs.readFile('config.txt', function (err , data){
		if (err) {
			throw err;
		}
		var i, data1 = data.toString().split('\n');

		for(i = 0; i < data1.length; i += 1) {
			data1[i] = data1[i].split('=');			
		}

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
		self.emit('readConfig', 'configuration read from config.txt');
	});
};

exports.checkFiles = function(self) {
	fs.readFile(self.config.keyname, function (err) {
		if (err) {
			// Bits for key to be generated | KeyName
			generator.genPrivateKey(self.config.keysize, self.config.keyname);
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
			self.emit('generatedCert','true');
			return;	
		}
		self.emit('generatedCert','false');
	});
};

exports.generateSessionId = function(cn, options) {
	var temp, obj = {}, id, tmp;
	obj={'commnonname':cn, 'sessionid':''};
	obj.sessionid= cn +':';
	temp = options.cert.toString();
	for(i = 0; i < (40 - obj.sessionid.length -1); i += 1) {
		id = Math.floor(Math.random() * options.cert.length);
		tmp = temp.substring(id, id+1);
		if(tmp === ' ' || tmp === '\n')	{
			i -= 1;
			continue;
		}	
		obj.sessionid+=temp.substring(id, id+1);
	}
	return obj;
};

exports.serverConfig = function(config) {
	var options = {
		key: fs.readFileSync(config.keyname),
		cert: fs.readFileSync(config.certname),
		ca: /*[*/fs.readFileSync(config.mastercertname),/*,fs.readFileSync('othrecert.pem')],*/// This is self signed certificate, so PZH is its own CA
		requestCert:true, // This field controls whether client certificate will be fetched for mutual authentication
		requestUnauthorized:false
	};
	return options
}

exports.removeClient = function(self, conn) {
	for(i = 0; i < webinos.session.pzh.connected_pzp.length; i += 1) {
		if(webinos.session.pzh.connected_pzp[i].socket.socket.remotePort === conn.socket.remotePort) {
			for( j =0; j < self.connected_client.length; j += 1) {
				if(self.connected_client[j].sessionid === webinos.session.pzh.connected_pzp[i].session) { 
					console.log('PZ Common: Removed client: '+self.connected_client[j].sessionid );
					self.connected_client.pop(j);
					break;
				}
			}
			webinos.session.pzh.connected_pzp.pop(i);
			break;
		}
	}
};

exports.generateServerCertifiedCert = function(cert, config) {
	generator.genCertifiedCertificate(cert,
		config.days,
		config.certname,
		config.mastercertname,
		config.masterkeyname,
		function(err) {
			console.log('PZ Common: Certificate generation error' + err);
		});
};

exports.generateClientCertifiedCert = function(cert, config) {
	generator.genCertifiedCertificate(cert,
		config.days,
		config.clientcertname,
		config.mastercertname,
		config.masterkeyname,
		function(err) {
			console.log('PZ Common: Certificate generation error' + err);
		});
};

exports.checkClient = function (connected_client, cn){
	var found = false;
	for(i = 0; i < connected_client.length; i += 1) {
		if(connected_client[i].commonname === cn) {
			found = true;
			break;
		}
	}
	return found;
};

exports.masterCert = function (self) {
	console.log('PZ Common: generating master server key');
	// Bits for key to be generated | KeyName
	generator.genPrivateKey(self.config.masterkeysize, self.config.masterkeyname);

	console.log('PZ Common: generating master server cert');
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
};

exports.addTrustedCert = function(self) {
	console.log('PZ Common: Add Cert ');
	generator.addTrustedCert();
};

