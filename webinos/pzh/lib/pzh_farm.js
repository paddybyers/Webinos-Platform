var tls         = require('tls');
var path        = require('path');
var util        = require('util');

var moduleRoot      = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies    = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot     = path.resolve(__dirname, '../' + moduleRoot.root.location);

var cert            = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var utils           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
var log             = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var configuration   = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));
var PzhWebInterface = require(path.join(webinosRoot, dependencies.pzh.location, 'web/pzh_web_interface.js'));

var farm = exports;
farm.pzhs =[];


/**
 * @description: It starts farm. 
 * @param config: Holds certificate details
 * @param callback: true in case successful or else false in case unsucessful
 */
farm.startFarm = function (url, contents, callback) {
	var self = this;
	configuration.createDirectoryStructure();
	configuration.setConfiguration(contents, 'PzhFarm', function (config, conn_key) {
		
		var options = {key: conn_key,
			cert: config.conn.cert,
			ca:   config.master.cert,
			requestCert: true };

		config.servername = url;
		startWebInterface (config);
		farm.server = tls.createServer (options, function (conn) {
			log('DEBUG', conn.servername);
			if (conn.servername && farm.pzhs[conn.servername]) {
				log('INFO', '[PZHFARM] sending message to ' + conn.servername);
				farm.pzhs[conn.servername].handleConnectionAuthorization(farm.pzhs[conn.servername], conn);
			} else {
				log('ERROR', '[PZHFARM] Server Is Not Registered in Farm');
			}

			conn.on('data', function(data){
				log('INFO', '[PZHFARM] msg received at farm');
				if(conn.servername && farm.pzhs[conn.servername]) {
					farm.pzhs[conn.servername].handleData(conn, data);
				}
			});

			conn.on('end', function(err) {
				log('INFO', '[PZHFARM] ' +conn.servername+' connection end' + err);
			});

			// It calls removeClient to remove PZP from connected_client and connectedPzp.
			conn.on('close', function() {
				try {
					log('INFO', '[PZHFARM] ('+conn.servername+') Pzh/Pzp  closed');
					//var removed = utils.removeClient(self, conn);
					//self.messageHandler.removeRoute(removed, conn.servername);
				} catch (err) {
					log('ERROR', '[PZHFARM] ('+conn.servername+') Remove client from connectedPzp/connectedPzh failed' + err);
				}
			});

			conn.on('error', function(err) {
				log('ERROR', '[PZHFARM] ('+conn.servername+') General Error' + err);

			});
		});

		farm.server.on('listening', function(){
			log('INFO', '[PZHFARM] Intialized *********** ');
			callback(true);
		});

		farm.server.listen(8000);
	});
};

farm.getPzhInstance = function (url, user) {
	for (var myKey in farm.pzhs)	{
		if ( myKey === url && (farm.pzhs[myKey].config.userDetails && farm.pzhs[myKey].config.userDetails.displayName === user.displayName)) {
			return farm.pzhs[myKey];
		}		
	}

	// User Details has not been added to PZH 
	if(farm.pzhs[url]) {
		farm.pzhs[url].config.userDetails = user;
		configuration.storeConfig(farm.pzhs[url].config);
		return farm.pzhs[url];
	}
	
	// PZH is not started, call addPZH but how to get parameters, redirect back to user to get cert details??
	// Pzh.addPzh();
}

function startWebInterface (config) {
	// WEB INTERFACE INITIALIZATION
	var requestClientCert = false;   // Are we requesting a client certificate?
	var httpOnly = false;           // Are we running HTTP or HTTPS?
	var webinosDemo = utils.webinosConfigPath();

	if (!path.exists(path.join(webinosDemo+'/config/',config.certValues.common.split(':')[0]))) {
		cert.selfSigned( 'PzhWeb', config.certValues, function(status, selfSignErr, ws_key, ws_cert, csr ) {
			if(status === 'certGenerated') {
				var key      = require(path.resolve(webinosRoot,dependencies.manager.keystore.location));
				master_key   = key.get(config.master.key_id);
				cert.signRequest(csr, master_key,  config.master.cert, 1, function(result, cert) {
					if(result === 'certSigned') {
						config.webServer.cert = cert;
						key.put(config.webServer.key_id, ws_key);
						configuration.storeConfig(config);
					}
				});				
			} else {
				log('ERROR', '[PZH WEB INTERFACE] Certificate generation error')
			}
		});
	}
	PzhWebInterface.startServer(configuration.pzhWebPort, requestClientCert, httpOnly, config, function(status) {
		if (status) {
			log('INFO','[PZH WEB INTERFACE] STARTED ====================');
		} else {
			log('ERROR','[PZH WEB INTERFACE] FAILED TO START *************');
		}
	});
	 
		
}