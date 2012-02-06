var configure = exports;

var os            = require('os');
var path          = require('path');
var fs            = require('fs');
var moduleRoot    = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies  = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot   = path.resolve(__dirname, '../' + moduleRoot.root.location);

var cert          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var log           = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_helper.js')).debug;
var uniqueID      = require(path.join(webinosRoot, dependencies.uniqueID.location, 'lib/uniqueID.js'));

configure.webinosDemoPath = function() {
	var webinosDemo;
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
	
	return webinosDemo;
};

/** 
* @descripton Checks for master certificate, if certificate is not found it calls generating certificate function defined in certificate manager. This function is crypto sensitive. 
* @param {function} callback It is callback function that is invoked after checking/creating certificates
*/
configure.setConfiguration = function (id, contents, pzhType, callback) {
	// ASSUMPTION: ID URI should be of form pzh.webinos.org
	var webinosDemo = configure.webinosDemoPath();
	var config;
	
	fs.readFile(( webinosDemo+'/config/'+ id +'.txt'), function(err, data) {
		if ( err && err.code=== 'ENOENT' ) {
			// CREATE NEW CONFIGURATION
			// TODO: If configuration file is deleted and certificates exist

			var name = id;

			if (id.split['/'] && id.split['/'][1]) {
				name = id.split['/'][1];
			}

			config = createConfigStructure(name);
			setCertValue(config, contents);
			createPZHDirectories( webinosDemo, name, config);
			// This self signed certificate is for getting connection certificate CSR.
			cert.selfSigned( pzhType, config.certValues, config.cert.conn, function(status, selfSignErr) {
				if(status === 'certGenerated') {
					log('INFO', ' [CONFIG] PZH Generating Certificates');
					// This self signed certificate is  master certificate / CA
					cert.selfSigned( pzhType+'CA', config.certValues, config.cert.master, function(result, selfSignErr) {
						if(result === 'certGenerated') {
							log('INFO', ' [CONFIG] CA Certificate');
							try {
								// This is working, waiting for completion of Android and Windows part to commit code.
								/*try {
									var key =require("../../common/manager/keystore/src/build/Release/keystore");
									key.put(config.master.key.name, config.master.key.value);
									key.put(config.conn.key.name, config.conn.key.value);
								} catch (err) {
									log('ERROR', "Error reading key from key store "+ err);
									return;
								}*/

								fs.writeFileSync(config.cert.pzhKeyDir+'/' +config.cert.master.key.name,  config.cert.master.key.value);
								fs.writeFileSync(config.cert.pzhCertDir+'/'+config.cert.master.cert.name, config.cert.master.cert.value);
								fs.writeFileSync(config.cert.pzhCertDir+'/'+config.cert.master.crl.name,  config.cert.master.crl.value);

								cert.signRequest(config.cert.conn.csr.value, config.cert.master, 1, function(result, cert) {
									// connection certificate signed by master certificate
									log('INFO', ' [CONFIG] CA Signed Conn Certificate ' + result);
									if(result === 'certSigned') {
										try {
											fs.writeFileSync(config.cert.pzhCertDir+'/'+config.cert.conn.cert.name, config.cert.conn.cert.value);
											fs.writeFileSync(config.cert.pzhKeyDir+'/' +config.cert.conn.key.name,  config.cert.conn.key.value);
											fs.writeFileSync((webinosDemo+ '/config/' + id+'.json'), JSON.stringify(config, null, " "));
											callback(config);
										} catch (err) {
											log('ERROR',' [CONFIG] ('+id+') Error writing connection certificate');
											return;
										}
									} else {
										log('ERROR', '[CONFIG] Manager Status: ' + result);
										callback(false);
									}
								});
							} catch (err) {
								log('ERROR', '[CONFIG] Certificate generation error');
							}
						}
					});
				}
			});
			
		} else {
			log('INFO', data);

			var name = id;

			if (id.split['/'] && id.split['/'][1]) {
				name = id.split['/'][1];
			}
			config = createConfigStructure();
			config.cert.master.cert.value = fs.readFileSync(config.cert.pzhCertDir+'/'+config.cert.master.cert.name).toString();
			config.cert.master.key.value  = fs.readFileSync(config.cert.pzhKeyDir+'/'+config.cert.master.key.name).toString();
			config.cert.conn.key.value    = fs.readFileSync(config.cert.pzhKeyDir+'/'+config.cert.conn.key.name).toString();
			config.cert.conn.cert.value   = fs.readFileSync(config.cert.pzhCertDir+'/'+config.cert.conn.cert.name).toString();

			// TODO: This works fine for linux and mac. Requires implementation on Android and Windows
			/*try{
				//var key =require("../../common/manager/keystore/src/build/Release/keystore");
				//config.master.key.value = key.get(config.master.key.name);
				//config.conn.key.value = key.get(config.conn.key.name);
			} catch(err){
				console.log(err);
				return;
			}*/

			//config.master.key.value = fs.readFileSync(pzhKeyDir+'/'+config.master.key.name).toString();
			if ( path.existsSync(config.cert.pzhCertDir+'/'+config.cert.master.crl.name)) {
				config.cert.master.crl.value = fs.readFileSync(config.cert.pzhCertDir+'/'+config.cert.master.crl.name).toString();
				log('INFO', "[CONFIG] Using CRL " + config.cert.pzhCertDir+'/'+config.cert.master.crl.name);
			} else {
				config.cert.master.crl.value = null;
				log('INFO', "[CONFIG] WARNING: No CRL found.  May be worth regenerating your certificates");
			}

			callback.call(self, config);
		}
	});


};


configure.createDirectoryStructure = function (callback) {
	var webinosDemo = configure.webinosDemoPath();
	try {
		// Main webinos directory
		fs.readdir ( webinosDemo, function(err) {
			if ( err && err.code === 'ENOENT' ) {
				fs.mkdirSync( webinosDemo,'0700');
			}
		});
		// Configuration directory, which holds information about certificate, ports, openid details
		fs.readdir ( webinosDemo+'/config', function(err) {
			if ( err && err.code=== 'ENOENT' ) {
				fs.mkdirSync( webinosDemo +'/config','0700');
			}
		});
		// Certificates diretory
		fs.readdir ( webinosDemo+'/certificates', function(err) {
			if ( err && err.code === 'ENOENT' ) {
				fs.mkdirSync( webinosDemo +'/certificates','0700');
			}
		});
		fs.readdir ( webinosDemo+'/certificates/PZH', function(err) {
			if ( err && err.code === 'ENOENT' ) {
				fs.mkdirSync( webinosDemo +'/certificates/PZH','0700');
			}
		});
	} catch (err){
		log('ERROR', '[CONFIG] Error setting default Webinos Directories' + err.code);
		
		
	}
}

function createPZHDirectories (webinosDemo, id, config ) {
	var pzhName                   = webinosDemo+'/certificates/PZH/'+id;
	config.cert.pzhName           = pzhName;
	config.cert.pzhCertDir        = path.resolve(webinosDemo, pzhName+'/cert');
	config.cert.pzhKeyDir         = path.resolve(webinosDemo, pzhName+'/keys');
	config.cert.pzhSignedCertDir  = path.resolve(webinosDemo, pzhName+'/signed_cert');
	config.cert.pzhOtherCertDir   = path.resolve(webinosDemo, pzhName+'/other_cert');
	config.cert.pzhRevokedCertDir = path.resolve(webinosDemo, pzhName+'/signed_cert/revoked');

	fs.readdir(pzhName, function(err) {
		if(err && err.code === "ENOENT") {
			try {
				fs.mkdirSync(config.cert.pzhName,'0700');
				fs.mkdirSync(config.cert.pzhCertDir, '0700');
				fs.mkdirSync(config.cert.pzhSignedCertDir, '0700');
				fs.mkdirSync(config.cert.pzhKeyDir, '0700');
				fs.mkdirSync(config.cert.pzhOtherCertDir, '0700');
				fs.mkdirSync(config.cert.pzhRevokedCertDir, '0700');
				
			} catch(err) {
				log('ERROR',' [CONFIG] ('+id+') Error creating certificates/pzh/pzh_name/ directories');
				return;
			}
		}
	});	
};

function createConfigStructure (name) {
	var config = {};
	config.cert = {
		conn : {
			key:  { name: name+'_conn_key.pem'},
			cert: { name: name+'_conn_cert.pem'},
			csr:  { name: name+'_conn_cert.csr'},
			crl:  { name: name+'_conn_cert.crl'}
		},
		master : {
			key:  { name: name+'_master_key.pem'},
			cert: { name: name+'_master_cert.pem'},
			csr:  { name: name+'_master_cert.csr'},
			crl:  { name: name+'_master_cert.crl'}
		},
		webserver : {
			cert : { name : name+'_ws_cert.pem' },
			key :  { name : name+'_ws_key.pem' }
		}
	};
	config.certValues = {};
	return config;
}

function setCertValue(config, contents) {
	var i, data1;
	data1 = contents.toString().split('\n');

	for(i = 0; i < data1.length; i += 1) {
		data1[i] = data1[i].split('=');
	}

	for(i = 0; i < data1.length; i += 1) {
		if(data1[i][0] === 'country') {
			config.certValues.country = data1[i][1];
		} else if(data1[i][0] === 'state') {
			config.certValues.state   = data1[i][1];
		} else if(data1[i][0] === 'city') {
			config.certValues.city    = data1[i][1];
		} else if(data1[i][0] === 'organization') {
			config.certValues.orgname = data1[i][1];
		} else if(data1[i][0] === 'organizationUnit') {
			config.certValues.orgunit = data1[i][1];
		} else if(data1[i][0] === 'common') {
			config.certValues.common  = data1[i][1] +':DeviceId('+os.type+')';
		} else if(data1[i][0] === 'email') {
			config.certValues.email    = data1[i][1];
		} else if(data1[i][0] === 'days') {
			config.certValues.days   = data1[i][1];
		}
	}
}