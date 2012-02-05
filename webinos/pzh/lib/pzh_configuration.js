var os = require('os');
var path = require('path');
var pzhConfig = exports;

var ERROR = 1;

var CA = 0;
var CONNCERT = 1;

/** 
* @descripton Checks for master certificate, if certificate is not found it calls generating certificate function defined in certificate manager. This function is crypto sensitive. 
* @param {function} callback It is callback function that is invoked after checking/creating certificates
*/
pzhConfig.config = function (url, callback) {
	try {
		var id = url.split('/')[1];
		
		switch(os.type().toLowerCase()){
			case 'windows_nt':
				webinosDemo = path.resolve(process.env.appdata + '/webinos/');
				break;
			case 'linux':
				switch(os.platform().toLowerCase()){
					case 'android':
						webinosDemo = path.resolve(process.env.EXTERNAL_STORAGE + '/.webinos/');
						break;
					case 'linux':
						webinosDemo = path.resolve(process.env.HOME + '/.webinos/');
						break;	
				}
				break;
			case 'darwin':
				webinosDemo = path.resolve(process.env.HOME + '/.webinos/');
				break;
		}
		
		var config = path.resolve(webinosDemo+'/config/' + id +'.txt');
		fs.readFile(config, function(err, data) {
			if(err === 'ENOENT') {
				var pzhRoot = webinosDemo+'/certificates/pzh';
				var pzhName = pzhRoot+'/'+id;
				config.pzhName = pzhName;
				config.pzhCertDir = path.resolve(__dirname, pzhName+'/cert'),
				config.pzhKeyDir = path.resolve(__dirname, pzhName+'/keys'),
				config.pzhSignedCertDir = path.resolve(__dirname, pzhName+'/signed_cert'),
				config.pzhOtherCertDir  = path.resolve(__dirname, pzhName+'/other_cert'),
				config.pzhRevokedCertDir = path.resolve(__dirname, pzhName+'/signed_cert/revoked');
						
		// This self signed certificate is for getting connection certificate CSR. 
		cert.selfSigned(self, 'Pzh', config.conn, 1, function(status, selfSignErr) {
			if(status === 'certGenerated') {
			log(INFO, 'PZH Generating Certificates');
			fs.readdir(webinosDemo+'/certificates', function(err) {
				if(err !== null && err.code === "ENOENT") {
				try {
				fs.mkdirSync(webinosDemo+'/certificates', '0700');
				} catch (err) {
				log(ERROR,' @pzhfarm@ ('+id+') Error creating certificates directory');
				return;
				}
				}
			fs.readdir(pzhRoot, function(err) {
				if(err !== null && err.code === "ENOENT") {
				try {
				fs.mkdirSync(pzhRoot, '0700');
				} catch(err) {
				log(ERROR,' @pzhfarm@ ('+id+') Error creating certificates/pzh directory');
				return;
				}
				}
				fs.readdir(pzhName, function(err) {
					if(err !== null && err.code === "ENOENT") {
						try {	
							fs.mkdirSync(pzhName,'0700');
							fs.mkdirSync(config.pzhCertDir, '0700');	
							fs.mkdirSync(config.pzhSignedCertDir, '0700');
							fs.mkdirSync(config.pzhKeyDir, '0700');
							fs.mkdirSync(config.pzhOtherCertDir, '0700');
							fs.mkdirSync(config.pzhRevokedCertDir, '0700');
						} catch(err) {
							log(ERROR,' @pzhfarm@ ('+id+') Error creating certificates/pzh/pzh_name/ directories');
							return;
						}
					}
									
					// This self signed certificate is  master certificate / CA
					cert.selfSigned(self, 'Pzh:Master', config.master, CA, function(result) {
					if(result === 'certGenerated') {
						try {
						// This is working, waiting for completion of Android and Windows part to commit code.
						/*try {
							var key =requiserverre("../../common/manager/keystore/src/build/Release/keystore");				
							key.put(self.config.master.key.name, self.config.master.key.value);
							key.put(self.config.conn.key.name, self.config.conn.key.value);
						} catch (err) {
							log(ERROR, "Error reading key from key store "+ err);
							return;
						}*/
												
						fs.writeFileSync(config.pzhKeyDir+'/'+config.master.key.name, config.master.key.value);
						fs.writeFileSync(config.pzhKeyDir+'/'+config.conn.key.name, config.conn.key.value);
							
						fs.writeFileSync(config.pzhCertDir+'/'+config.master.cert.name, config.master.cert.value);
						fs.writeFileSync(config.pzhCertDir+'/'+config.master.crl.name, config.master.crl.value);
						} catch (err) {
							log(ERROR,'PZH ('+id+') Error writing master certificates file');
							return;
						}
		
						// Signed request for connection certificate by master certificate
						cert.signRequest(self, self.config.conn.csr.value, self.config.master, 1, function(result, cert) {
							if(result === 'certSigned'){ 
								self.config.conn.cert.value = cert;
								try {
									fs.writeFileSync(self.config.pzhCertDir+'/'+self.config.conn.cert.name, cert);
									callback.call(self, 'Certificates Created');
								} catch (err) {
									log(ERROR,'PZH ('+id+') Error writing connection certificate');
									return;
								}
							}
						});
					}
				});								
			});
		});
	});
	} else {
		log(ERROR, 'cert manager status: ' + status);
		if (typeof selfSignErr !== 'undefined') {
			log(ERROR, 'cert manager error: ' + selfSignErr);
		}
	}
	});
			} else {

				self.config.master.cert.value = fs.readFileSync(self.config.pzhCertDir+'/'+self.config.master.cert.name).toString(); 
				self.config.master.key.value = fs.readFileSync(self.config.pzhKeyDir+'/'+self.config.master.key.name).toString(); 
				self.config.conn.key.value = fs.readFileSync(self.config.pzhKeyDir+'/'+self.config.conn.key.name).toString(); 
				self.config.conn.cert.value = fs.readFileSync(self.config.pzhCertDir+'/'+self.config.conn.cert.name).toString(); 
				
				// TODO: This works fine for linux and mac. Requires implementation on Android and Windows
				/*try{ 
					//var key =require("../../common/manager/keystore/src/build/Release/keystore");
					//self.config.master.key.value = key.get(self.config.master.key.name);
					//self.config.conn.key.value = key.get(self.config.conn.key.name);
				} catch(err){
					console.log(err);
					return;
				}*/
				
				//self.config.master.key.value = fs.readFileSync(pzhKeyDir+'/'+self.config.master.key.name).toString();
				if ( path.existsSync(self.config.pzhCertDir+'/'+self.config.master.crl.name)) {
					self.config.master.crl.value = fs.readFileSync(self.config.pzhCertDir+'/'+self.config.master.crl.name).toString();
					log(INFO, "Using CRL " + self.config.pzhCertDir+'/'+self.config.master.crl.name);
				} else {
					self.config.master.crl.value = null;
					log(INFO, "WARNING: No CRL found.  May be worth regenerating your certificates");
				}
				
				callback.call(self, config);
			}
		});
	} catch(err) {
		log(ERROR,'PZH ('+id+') Exception in reading/creating certificates' + err);
	
	}
};