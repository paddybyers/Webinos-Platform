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

configure.pzhPort    = 8000; 
configure.pzhWebPort = 8083;

configure.storeConfig = function (config) {
	var webinosDemo = common.webinosConfigPath();
	var name = config.certValues.common.split(':')[0];
	fs.writeFile((webinosDemo+ '/config/'+name+'.json'), JSON.stringify(config, null, " "), function(err) {
		if(err) {
			log('ERROR', '[CONFIG] Error saving configuration file');
		} else {
			log('INFO', '[CONFIG] Saved configuration file');
		}
		
	});
	
}
/**
* @descripton Checks for master certificate, if certificate is not found it calls generating certificate function defined in certificate manager. This function is crypto sensitive.
* @param {function} callback It is callback function that is invoked after checking/creating certificates
*/
configure.setConfiguration = function (contents, type, callback) {
	var webinosDemo = common.webinosConfigPath();
	var config;

	setCertValue(contents , function(certValues) {
		var name = certValues.common.split(':')[0];
		fs.readFile(( webinosDemo+'/config/'+ name +'.json'), function(err, data) {
			if ( err && err.code=== 'ENOENT' ) {

				// CREATE NEW CONFIGURATION
				config = createConfigStructure(name, type, certValues);

				// This self signed certificate is for getting connection certificate CSR.
				try {
				cert.selfSigned( type, config.certValues, function(status, selfSignErr, conn_key, conn_cert, csr ) {
					if(status === 'certGenerated') {
						log('INFO', '[CONFIG] Generated CONN Certificates');
						if (type !== 'Pzp') {
							// This self signed certificate is  master certificate / CA
							cert.selfSigned( type+'CA', config.certValues, function(result, selfSignErr, master_key, master_cert) {
								if(result === 'certGenerated') {
									log('INFO', '[CONFIG] Generated CA Certificate');
									cert.signRequest(csr, master_key,  master_cert.cert, 1, function(result, cert) {
										// connection certificate signed by master certificate
										if(result === 'certSigned') {
											log('INFO', '[CONFIG] Generated CA Signed CONN Certificate ');
											try {
												config.master.cert = master_cert.cert;
												config.master.crl  = master_cert.crl;
												config.conn.cert   = cert;
												
												// This works only for Linux and MAC
												try {
													fs.writeFileSync(config.master.key_id, master_key);
													fs.writeFileSync(config.conn.key_id, conn_key);
												} catch (err) {
													log('ERROR', '[CONFIG] Storing keys in key store' + err);
													callback("undefined");
													return;
												}
											} catch (err1) {
												log('ERROR','[CONFIG] Error setting paramerters' + err1) ;
												callback("undefined");
												return;
											}
												
											try {
												configure.storeConfig(config);
												callback(config, conn_key);
											} catch (err) {
												log('ERROR','[CONFIG] Error writing configuration file' + err) ;
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
							// PZP SECTION
							try {
								try{
									fs.readFile(config.conn.key_id, function(conn_key){
										config.conn.cert = conn_cert.cert;
										configure.storeConfig(config);
										callback(config, conn_key, csr);
									});
								} catch (err) {
									log('ERROR', '[CONFIG] Error storing key in key store '+ err);
									return;
								}	

							} catch (err) {
								log('ERROR',' [CONFIG] Error writing configuration file');
								callback("undefined");
								return;
							}
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
				var data1 = data.toString('utf8');
				config = JSON.parse(data1);
				var master_key = null, conn_key;
				// TODO: FIXME:  This works fine for linux and mac. Requires implementation on Android and Windows
				
				try{
					fs.readFile(config.conn.key_id, function(conn_key){
						callback(config, conn_key);
					});
				} catch(err){
					log('ERR0R','[CONFIG] Key fetching error' )
					return;
				}
				
				
			}
		});
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

function createConfigStructure (name, type, certValues) {
	var config = {};
	if (type === 'Pzh') {
		config.conn        = { key_id: name+'_conn_key',   cert:''};
		config.master      = { key_id: name+'_master_key', cert:'', crl:'' };
		config.signedCert  = {};
		config.revokedCert = {};
		config.otherCert   = {};
	} else if (type === 'PzhFarm') {
		config.conn      = { key_id: name+'_conn_key',   cert:''};
		config.master    = { key_id: name+'_master_key', cert:''} ;
		config.webServer = { key_id: name+'_ws_key',     cert:''} ;
	} else if (type === 'Pzp' ){
		config.conn   = { key_id: name+'_conn_key', cert:''};
		config.master = { cert:'', crl:'' };		
	};
	config.userDetails = {};
	config.certValues  = certValues;
	return config;
}

function setCertValue(contents, callback) {
	var certValues = {};
	var i;
	var data = contents.toString().split('\n');

	for(i = 0; i < data.length; i += 1) {
		data[i] = data[i].split('=');
	}

	for(i = 0; i < data.length; i += 1) {
		if(data[i][0] === 'country') {
			certValues.country = data[i][1];
		} else if(data[i][0] === 'state') {
			certValues.state   = data[i][1];
		} else if(data[i][0] === 'city') {
			certValues.city    = data[i][1];
		} else if(data[i][0] === 'organization') {
			certValues.orgname = data[i][1];
		} else if(data[i][0] === 'organizationUnit') {
			certValues.orgunit = data[i][1];
		} else if(data[i][0] === 'common') {
			certValues.common  = data[i][1];
		} else if(data[i][0] === 'email') {
			certValues.email    = data[i][1];
		} else if(data[i][0] === 'days') {
			certValues.days   = data[i][1];
		}
	}
	callback(certValues);
}