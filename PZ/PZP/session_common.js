var  fs = require('fs'),
     crypto = require('crypto'),	
	x,
	generator;

// node.js has changed directory structure. Might be not required in future
x = process.version;
x = x.split('.');
if ( x[1] >= 5) {
	generator = require('./build/Release/generator.node');
} else {
	generator = require('./build/default/generator.node');
}

//read config.txt to load values needed for certificate creation and file name
exports.readConfig = function (filename, session, self) {
	fs.readFile(filename, function (err , data){
		if (err) {
			throw err;
		}
		var i, data1 = data.toString().split('\n');

		for(i = 0; i < data1.length; i += 1) {
			data1[i] = data1[i].split('=');			
		}

		for(i = 0; i < data1.length; i += 1) {
			if(data1[i][0] === 'country') {
				session.config.country = data1[i][1];
			} else if(data1[i][0] === 'state') {
				session.config.state = data1[i][1];
			} else if(data1[i][0] === 'city') {
				session.config.city = data1[i][1];
			} else if(data1[i][0] === 'organization') {
				session.config.orgname = data1[i][1];
			} else if(data1[i][0] === 'organizationUnit') {
				session.config.orgunit = data1[i][1];
			} else if(data1[i][0] === 'common') {
				session.config.common = data1[i][1];
			} else if(data1[i][0] === 'email') {
				session.config.email = data1[i][1];
			} else if(data1[i][0] === 'days') {
				session.config.days = data1[i][1];
			} else if(data1[i][0] === 'keyName') {
				session.config.keyname = data1[i][1];
			} else if(data1[i][0] === 'keySize') {
				session.config.keysize = data1[i][1];
			} else if(data1[i][0] === 'certName') {
				session.config.certname = data1[i][1];
			} else if(data1[i][0] === 'caName') {
				session.config.caname = data1[i][1];
			} else if (data1[i][0] === 'clientCertName') {
				session.config.clientcertname = data1[i][1];
			} else if (data1[i][0] === 'masterKeyName') {
				session.config.masterkeyname = data1[i][1];
			} else if (data1[i][0] === 'masterKeySize') {
				session.config.masterkeysize = data1[i][1];
			} else if (data1[i][0] === 'masterCertName') {
				session.config.mastercertname = data1[i][1];
			} else if (data1[i][0] === 'otherPZHCert') {
				session.config.otherPZHCert = data1[i][1];
			}

		}
		self.emit('readConfig', 'configuration read');
	});
};
//This is used for generating id for session. This code is currently not used.
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

/* generate self signed certificates if certificates are not present. 
 * This results in native code call.Create self signed certificate for PZH. 
 * It performs following functionality
 * 1. openssl genrsa -out server-key.pem
 * 2. openssl req -new -key server-key.pem -out server-csr.pem
 * 3. openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem
 * 
 */
exports.generateSelfSignedCert = function(session, self) {
	console.log('PZ Common: ' + session.config.keyname);
	if(typeof session.config.keyname !== "undefined") {
		fs.readFile(session.config.keyname, function (err) {
			if (err) {
			// Bits for key to be generated | KeyName
				generator.genPrivateKey(session.config.keysize, session.config.keyname);
				generator.genSelfSignedCertificate(session.config.country,
					session.config.state,
					session.config.city,
					session.config.orgname,
					session.config.orgunit,
					session.config.common,
					session.config.email,
					session.config.days,
					session.config.certname,
					session.config.keyname);
				self.emit('generatedCert','true');
				return;	
			}
			self.emit('generatedCert','false');
		});
	} 
};

/* This creates certificate signed by master certificate on PZH. This function
 *  is used twice on PZH only. This results in native code call.
 */
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

/* This is called once from PZH to generate master certificate for PZH.
 * This results in native code call.
 */
exports.generateClientCertifiedCert = function(cert, config) {
	if( cert !== ""){
		generator.genCertifiedCertificate(cert,
			config.days,
			config.clientcertname,
			config.mastercertname,
			config.masterkeyname,
			function(err) {
				console.log('PZ Common: Certificate generation error' + err);
			});
	}
};

/* Before adding client it checks if client is already present or not.
 * Not used currently
 */
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

/*  It removes the connected PZP details.
 */
exports.removeClient = function(client, conn) {
	for (myKey in client){
		if(client[myKey] === conn) {
			console.log('PZ Common : removed client ' + myKey );
			break;
		}
	}
};

/* This is called once from PZH to generate master certificate for PZH. 
 * This results in native code call.
 */
exports.generateMasterCert = function (session, self) {
	console.log('PZ Common: generating master server key');
	// Bits for key to be generated | KeyName
	generator.genPrivateKey(session.config.masterkeysize, session.config.masterkeyname);

	console.log('PZ Common: generating master server cert');
	// Country, State, City, OrgName, OrgUnit, Common, Email, Days, CertificateName
	var common = 'MasterCert:' + session.config.common;
	generator.genSelfSignedCertificate(session.config.country,
						session.config.state,
						session.config.city,
						session.config.orgname,
						session.config.orgunit,
						common,
						session.config.email,
						session.config.days,
						session.config.mastercertname,
						session.config.masterkeyname);
};

