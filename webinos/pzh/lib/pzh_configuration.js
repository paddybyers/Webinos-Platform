var configure = exports;

var path          = require('path');
var fs            = require('fs');
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
configure.setConfiguration = function (id, contents, pzhType, callback) {
	// ASSUMPTION: ID URI should be of form pzh.webinos.org
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
			cert.selfSigned( pzhType, config.certValues, config.cert.conn, function(status, selfSignErr) {
				if(status === 'certGenerated') {
					log('INFO', ' [CONFIG] PZH Generating Certificates');
					// This self signed certificate is  master certificate / CA
					cert.selfSigned( pzhType+'CA', config.certValues, config.cert.master, function(result, selfSignErr) {
						if(result === 'certGenerated') {
							log('INFO', ' [CONFIG] CA Certificate');
							try {
								cert.signRequest(config.cert.conn.csr, config.cert.master, 1, function(result, cert) {
									// connection certificate signed by master certificate
									log('INFO', ' [CONFIG] CA Signed Conn Certificate ');
									if(result === 'certSigned') {
										try {
											var name1 = (webinosDemo+ '/config/'+name+'.json');
											var value = JSON.stringify(config, null, " ");
											fs.writeFile(name1, value, function(err) {
												if(!err) {
													callback(config);
												}
											});
										} catch (err) {
											log('ERROR',' [CONFIG] ('+name+') Error writing configuration file');
											callback(false);
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
				} else {
					log('ERROR', status);
					log('ERROR', selfSignErr);
				}
				
			});
			
		} else {
			config = JSON.parse(data);
			var name = id;

			if (id.split['/'] && id.split['/'][1]) {
				name = id.split['/'][1];
			}
			
			// TODO: This works fine for linux and mac. Requires implementation on Android and Windows
			/*try{
				//var key =require("../../common/manager/keystore/src/build/Release/keystore");
				//config.master.key.value = key.get(config.master.key.name);
				//config.conn.key.value = key.get(config.conn.key.name);
			} catch(err){
				console.log(err);
				return;
			}*/
			callback(config);
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

	} catch (err){
		log('ERROR', '[CONFIG] Error setting default Webinos Directories' + err.code);
		
		
	}
}

function createConfigStructure (name) {
	var config = {};
	config.cert = {
		conn :      {key:{} , cert:{}, csr:{}, crl:{} },
		master :    {key:{} , cert:{}, csr:{}, crl:{} },
		webserver : {key:{} , cert:{} }
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