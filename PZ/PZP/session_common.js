var  fs = require('fs'),
    crypto = require('crypto'),
	child_process = require('child_process');

// This is a device id through which we recognize device
exports.getId = function (self, callback) {
	var id;
	console.log('PZ Common: Selected Platform - ' + process.platform);
	if(process.platform === 'cygwin') {
		var req = "getmac -V -FO CSV | awk -F \',\' \'{if(match($1, \"Local Area Connection\")) print $3;}\'";
		child_process.exec(req, function (error, stdout, stderr) {
			console.log('PZ Common: GetID stdout: ' + stdout);
			//console.log('PZ Common: GetID stderr: ' + stderr);
			id = stdout.split('\n');
			if (error !== null) {
				console.log('PZ Common: GetID exec error: ' + error);
			};
			callback.call(self, id[0]);	
		});
	} else if (process.platform === 'linux') {
		var req = "ifconfig | grep HWaddr | tr -s \' \' | cut -d \' \' -f5";
		child_process.exec(req, function (error, stdout, stderr) {
			//console.log('PZ Common: GetID stdout: ' + stdout);
			//console.log('PZ Common: GetID stderr: ' + stderr);
			id = stdout.split('\n');
			if (error !== null) {
				console.log('PZ Common: GetID exec error: ' + error);
			};
			callback.call(self, id[0]);	
		});
	}
}

/* generate self signed certificates if certificates are not present. 
 * This results in native code call.Create self signed certificate for PZH. 
 * It performs following functionality
 * 1. openssl genrsa -out server-key.pem
 * 2. openssl req -new -key server-key.pem -out server-csr.pem
 * 3. openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem
 * 
 */
exports.generateSelfSignedCert = function(self, callback) {
	child_process.exec('openssl genrsa -out ' + self.config.keyname + ' ' +self.config.keysize, 
		function (error, stdout, stderr) {
		//console.log('PZ Common: Self Generated Key stderr: ' + stderr);
		if (error !== null) {
		  console.log('PZ Common: Self Generated Key exec error: ' + error);
		};
		var req = 'openssl req -new -subj \"/C='+self.config.country+'/ST='+self.config.state+
			'/L='+self.config.city+'/CN='+self.config.common+'/emailAddress='+self.config.email + '\" -key ' +
			self.config.keyname + ' -out '+self.config.certnamecsr;
		//console.log(req);
		child_process.exec(req, function (error, stdout, stderr) {
			//console.log('PZ Common: Self Generated Cert 1 stderr: ' + stderr);
			if (error !== null) {
			  console.log('PZ Common: Self Generated Cert 1 exec error: ' + error);
			};
			var req = 'openssl x509 -req -days ' + self.config.days + ' -in ' + self.config.certnamecsr + ' -signkey ' + 
			self.config.keyname + ' -out ' + self.config.certname;
			//console.log(req);
			child_process.exec(req, function (error, stdout, stderr) {
				//console.log('PZ Common: Self Generated Cert 2 stderr: ' + stderr);
				if (error !== null) {
					console.log('PZ Common: Self Genereated Cert 2 Exec error: ' + error);
				};
		
				callback.call(self, 'true');
			});
		});
	});	
};

/* This creates certificate signed by master certificate on PZH. This function
 *  is used twice on PZH only. This results in native code call.
 */
exports.generateServerCertifiedCert = function(self, config, callback) {
	/*generator.genCertifiedCertificate(cert,	config.days, config.certname, config.mastercertname, config.masterkeyname, 
	function(err) {	console.log('PZ Common: Certificate generation error' + err);});*/
	var req = 'openssl x509 -req -days ' + config.days + ' -in ' +self.config.certnamecsr+ ' -CAcreateserial -CAkey ' + 
				config.masterkeyname + ' -CA ' + config.mastercertname+' -out ' + config.certname;

	//console.log(req);

	child_process.exec(req,  function (error, stdout, stderr) {
		//console.log('PZ Common: Server Certified Cert stderr: ' + stderr);
		if (error !== null) {
		  console.log('PZ Common: Server Certified Cert exec error: ' + error);						
		};
		callback.call(self, 'done');
	});
};


/* This is called once from PZH to generate master certificate for PZH.
 * This results in native code call.
 */
exports.generateClientCertifiedCert = function(certname, self, callback) {
	var req = 'openssl x509 -req -days ' + self.config.days + ' -in ' + certname + ' -CAcreateserial -CAkey ' +
			self.config.masterkeyname + ' -CA ' + self.config.mastercertname + ' -out ' + self.config.clientcert;
	//console.log('PZ Common : Client Cert ' +  req);
	child_process.exec(req, function (error, stdout, stderr) {
		//console.log('PZ Common: Server Certified Client Cert stderr: ' + stderr);
		if (error !== null) {
		  console.log('PZ Common: Server Certified Client Cert Exec error: ' + error);
		};
		callback.call(self, 'done');

	});
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
exports.generateMasterCert = function (self, callback) {
	var common = 'MasterCert:' + self.config.common;
	console.log('PZ Common: Generating Master Key & Certificate ');
	child_process.exec('openssl genrsa -out ' + self.config.masterkeyname + ' ' +self.config.masterkeysize, 
		function (error, stdout, stderr) {
			//console.log('PZ Common: Master Key  stdout: ' + stdout);
			//console.log('PZ Common: Master Key stderr: ' + stderr);
			if (error !== null) {
				console.log('PZ Common: Master Key exec error: ' + error);
			};
			var req = 'openssl req -new -subj \"/C='+self.config.country+'/ST='+self.config.state+
					'/L='+self.config.city+'/CN='+common+'/emailAddress='+self.config.email + '\" -key ' +
						self.config.masterkeyname + ' -out temp.csr';
			//console.log(req);
			child_process.exec(req, function (error, stdout, stderr) {
				//console.log('PZ Common: Master Cert stdout: ' + stdout);
				//console.log('PZ Common: Master Cert stderr: ' + stderr);
				if (error !== null) {
					console.log('PZ Common: Master Cert exec error: ' + error);
				};
				var req = 'openssl x509 -req -days ' + self.config.days + ' -in temp.csr -signkey ' + 
						self.config.masterkeyname + ' -out ' + self.config.mastercertname;
				//console.log(req);
				child_process.exec(req, function (error, stdout, stderr) {
					//console.log('PZ Common: Master Cert 2 stdout: ' + stdout);
					//console.log('PZ Common: Master Cert 2 stderr: ' + stderr);
					if (error !== null) {
						console.log('PZ Common: Master Cert 2 Exec error: ' + error);
					};
					if(typeof callback === "function")
						callback.call(self, 'done');
				});
			});
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

