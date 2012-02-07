var configure = exports;

var path          = require('path');
var fs            = require('fs');
var os            = require('os');

var moduleRoot    = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies  = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot   = path.resolve(__dirname, '../' + moduleRoot.root.location);

var cert          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var log           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var common        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
var uniqueID      = require(path.join(webinosRoot, dependencies.uniqueID.location, 'lib/uniqueID.js'));


/**
* @descripton Checks for master certificate, if certificate is not found it calls generating certificate function defined in certificate manager. This function is crypto sensitive.
* @param {function} callback It is callback function that is invoked after checking/creating certificates
*/
configure.setConfiguration = function (id, contents, type, callback) {
	var webinosDemo = common.webinosConfigPath();
	var config;
	
	var name = id;
	if (id.split('/') && id.split('/')[1]) {
		name = id.split('/')[1];
	}
	
	fs.readFile(( webinosDemo+'/config/'+ name +'.json'), function(err, data) {
		if ( err && err.code=== 'ENOENT' ) {
			// CREATE NEW CONFIGURATION
			config = createConfigStructure(name);
			setCertValue(config, contents);
			// This self signed certificate is for getting connection certificate CSR.
			try {
			cert.selfSigned( type, config.certValues, function(status, selfSignErr, conn_key, conn_cert, csr ) {
				if(status === 'certGenerated') {
					log('INFO', ' [CONFIG] Generated CONN Certificates');
					if (type !== 'Pzp') {
						// This self signed certificate is  master certificate / CA
						cert.selfSigned( type+'CA', config.certValues, function(result, selfSignErr, master_key, master_cert) {
							if(result === 'certGenerated') {
								log('INFO', ' [CONFIG] Generated CA Certificate');
								cert.signRequest(csr, master_key,  master_cert.cert, 1, function(result, cert) {
									// connection certificate signed by master certificate
									log('INFO', ' [CONFIG] Generated CA Signed CONN Certificate ');
									if(result === 'certSigned') {
										try {
											config.cert.master.cert = master_cert.cert;
											config.cert.master.crl  = master_cert.crl;
											config.cert.conn.cert   = conn_cert.cert;
											config.cert.conn.crl   = conn_cert.crl;
											
											// This works only for Linux and MAC
											try {
												var key = require(path.resolve(webinosRoot,dependencies.manager.keystore.location));
												key.put(config.cert.master.key_id, master_key);
												key.put(config.cert.conn.key_id,   conn_key);
											} catch (err) {
												log('ERROR', "[CONFIG] Storing keys in key store "+ err);
												callback("undefined");
												return;
											}
											fs.writeFile((webinosDemo+ '/config/'+name+'.json'), JSON.stringify(config, null, " "), function(err) {
												if(!err) {
													callback(config, conn_key);
												}
											});
										} catch (err) {
											log('ERROR',' [CONFIG] Error writing configuration file');
											callback("undefined");
											return;
										}
									} else {
										log('ERROR', '[CONFIG] Manager Status: ' + result);
										callback("undefined");
									}
								});

							}
						});
					} else {
						try {
							try{
								var key = require(path.resolve(webinosRoot,dependencies.manager.keystore.location));
								key.put(config.cert.conn.key_id, conn_key);
							} catch (err) {
								log('ERROR', "Error storing key in key store "+ err);
								return;
							}
							config.cert.conn.cert = conn_cert.cert;
							config.cert.conn.crl  = conn_cert.crl;
							
							fs.writeFile((webinosDemo+ '/config/'+name+'.json'), JSON.stringify(config, null, " "), function(err) {
								if(!err) {
									callback(config, conn_key, csr);
								}
							});
						} catch (err) {
							log('ERROR',' [CONFIG] Error writing configuration file');
							callback("undefined");
							return;
						}
						
						callback(config, conn_key, csr);
					}
					
				} else {
					log('ERROR', '[CONFIG] '+status);
					log('ERROR', '[CONFIG] '+selfSignErr);
				}

			});
			} catch (err) {
				log('ERROR', '[CONFIG] Certificate generation error');
			}

		} else {
			config = JSON.parse(data);
			// TODO: This works fine for linux and mac. Requires implementation on Android and Windows
			if (os.type === 'linux' && os.type === 'darwin') {
				try{
					var key =require("../../common/manager/keystore/src/build/Release/keystore");
					if (type !== 'Pzp') {
						master_key = key.get(config.master.key_id);
					}
					conn_key   = key.get(config.conn.key_id);
				} catch(err){
					log('ERR0R','[CONFIG] Key fetching error' )
					return;
				}
				callback(config, master_key, conn_key);
			}
		}
	});


};

configure.createDirectoryStructure = function (callback) {
	var webinosDemo = common.webinosConfigPath();
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
		// Configuration directory, which holds information about certificate, ports, openid details
		fs.readdir ( webinosDemo+'/logs', function(err) {
			if ( err && err.code=== 'ENOENT' ) {
				fs.mkdirSync( webinosDemo +'/logs','0700');
			}
		});

	} catch (err){
		log('ERROR', '[CONFIG] Error setting default Webinos Directories' + err.code);


	}
}

function createConfigStructure (name) {
	var config = {};
	config.cert = {
		conn   : { key_id: name+'_conn_key', cert:{}, crl:{} },
		master : { key_id: name+'_master_key', cert:{}, crl:{} },
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
			config.certValues.common  = data1[i][1] +':DeviceId('+uniqueID.getUUID_40.substring(0,10)+')';
		} else if(data1[i][0] === 'email') {
			config.certValues.email    = data1[i][1];
		} else if(data1[i][0] === 'days') {
			config.certValues.days   = data1[i][1];
		}
	}
}