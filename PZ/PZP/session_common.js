var  fs = require('fs'),
    crypto = require('crypto'),
	child_process = require('child_process'),
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
exports.readConfig = function (filename, self) {
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
			} else if (data1[i][0] === 'otherPZHCert') {
				self.config.otherPZHCert = data1[i][1];
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
exports.generateSelfSignedCert = function(self) {
	console.log('PZ Common: ' + self.config.keyname);
	if(typeof self.config.keyname !== "undefined") {
		fs.readFile(self.config.keyname, function (err) {
			if (err) {
			child_process.exec('openssl genrsa -out ' + self.config.keyname + ' ' +self.config.keysize);
			setTimeout(function() {
				var req = 'openssl req -new -subj \"/C='+self.config.country+'/ST='+self.config.state+
					'/L='+self.config.city+'/CN='+self.config.common+'/emailAddress='+self.config.email + '\" -key ' 
					+ self.config.keyname + ' -out temp1.csr';//'+self.config.certname;
				console.log(req);
				child_process.exec(req, function (error, stdout, stderr) {
						console.log('stdout: ' + stdout);
						console.log('stderr: ' + stderr);
						if (error !== null) {
						  console.log('exec error: ' + error);
						};
					});
				setTimeout(function() {
					var req = 'openssl x509 -req -days ' + self.config.days + ' -in temp1.csr -signkey ' + self.config.keyname + ' -out ' + self.config.certname;
					child_process.exec(req);
					setTimeout(function() {
						self.emit('generatedCert','true');
					}, 500);
				}, 500);
			
			}, 500);
			
			// Bits for key to be generated | KeyName
				/*child_process.exec('openssl genrsa -out ' + self.config.keyname + ' ' +self.config.keysize,
					function (error, stdout, stderr) {
						console.log('stdout: ' + stdout);
						console.log('stderr: ' + stderr);
						if (error !== null) {
						  console.log('exec error: ' + error);
						};
					});
				/*generator.genPrivateKey(self.config.keysize, self.config.keyname);
				generator.genSelfSignedCertificate(self.config.country,
					self.config.state,
					self.config.city,
					self.config.orgname,
					self.config.orgunit,
					self.config.common,
					self.config.email,
					self.config.days,
					self.config.certname,
					self.config.keyname);*/
							
			} else {
				self.emit('generatedCert','false');
			}
		});
	} 
};

/* This creates certificate signed by master certificate on PZH. This function
 *  is used twice on PZH only. This results in native code call.
 */
exports.generateServerCertifiedCert = function(config) {
	/*generator.genCertifiedCertificate(cert,	config.days, config.certname, config.mastercertname, config.masterkeyname, 
	function(err) {	console.log('PZ Common: Certificate generation error' + err);});*/
	var req = 'openssl x509 -req -days ' + config.days + ' -in temp1.csr -CAcreateserial -CAkey ' + config.masterkeyname + ' -CA ' + config.mastercertname+' -out ' + config.certname;

	console.log(req);

	child_process.exec(req,  function (error, stdout, stderr) {
						console.log('stdout: ' + stdout);
						console.log('stderr: ' + stderr);
						if (error !== null) {
						  console.log('exec error: ' + error);
						};
					});
};


/* This is called once from PZH to generate master certificate for PZH.
 * This results in native code call.
 */
exports.generateClientCertifiedCert = function(cert, config) {
	if( cert !== ""){
		/*generator.genCertifiedCertificate(cert, config.days, config.clientcertname,	config.mastercertname, config.masterkeyname, 
			function(err) {	console.log('PZ Common: Certificate generation error' + err);});*/
		var req = 'openssl x509 -days ' + config.days + ' -in ' + config.clientcertname + ' -CAcreateserial -CAkey ' + config.masterkeyname + ' -CA ' + config.mastercertname + ' -out ' + config.clientcertname;
		console.log(req);
		child_process.exec(req, function (error, stdout, stderr) {
						console.log('stdout: ' + stdout);
						console.log('stderr: ' + stderr);
						if (error !== null) {
						  console.log('exec error: ' + error);
						};
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
exports.generateMasterCert = function (self) {
	console.log('PZ Common: generating master server key');
	// Bits for key to be generated | KeyName
	//generator.genPrivateKey(self.config.masterkeysize, self.config.masterkeyname);

	// Country, State, City, OrgName, OrgUnit, Common, Email, Days, CertificateName
	var common = 'MasterCert:' + self.config.common;
	/*generator.genSelfSignedCertificate(self.config.country,
						self.config.state,
						self.config.city,
						self.config.orgname,
						self.config.orgunit,
						common,
						self.config.email,
						self.config.days,
						self.config.mastercertname,
						self.config.masterkeyname);
*/
	child_process.exec('openssl genrsa -out ' + self.config.masterkeyname + ' ' +self.config.masterkeysize);
	var req = 'openssl req -new -subj \"/C='+self.config.country+'/ST='+self.config.state+'/L='+self.config.city+'/CN='+common+
	'/emailAddress='+self.config.email + '\" -key ' + self.config.masterkeyname + ' -out temp.pem';
	console.log('PZ Common: generating master server cert');
	child_process.exec(req);
	var req = 'openssl x509 -req -days ' + self.config.days + ' -in temp.pem -signkey ' + self.config.masterkeyname + ' -out ' + self.config.mastercertname;
	child_process.exec(req);
};

