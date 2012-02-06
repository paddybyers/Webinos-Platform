var tls         = require('tls');
var path        = require('path');
var util        = require('util');

var moduleRoot    = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies  = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot   = path.resolve(__dirname, '../' + moduleRoot.root.location);

var cert          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var log           = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_helper.js')).debug;
var configuration = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_configuration.js'));

var pzhs = [];

var farm = exports;

/**
 * @description: It starts farm. 
 * @param config: Holds certificate details
 * @param callback: true in case successful or else false in case unsucessful
 */
farm.startFarm = function (url, contents, callback) {
	configuration.createDirectoryStructure();
	configuration.setConfiguration(url, contents, 'PzhFarm', function (config) {
		var options = {key: config.cert.conn.key.value,
			cert: config.cert.conn.cert.value,
			ca: config.cert.conn.cert.value,
			requestCert: true };
		
		farm.server = tls.createServer (options, function (conn) {
			log('DEBUG', conn.servername);
			if (conn.servername && pzhs[conn.servername]) {
				log('INFO', ' [PZHFARM] sending message to ' + conn.servername);
				pzhs[conn.servername].handleConnectionAuthorization(pzhs[conn.servername], conn);
			} else {
				log('ERROR', ' [PZHFARM] Server Is Not Registered in Farm');
			}

			conn.on('data', function(data){
				log('INFO', ' [PZHFARM] msg received at farm');
				if(conn.servername && pzhs[conn.servername]) {
					pzhs[conn.servername].handleData(conn, data);
				}
			});

			conn.on('end', function(err) {
				log('INFO', ' [PZHFARM] ' +conn.servername+' connection end' + err);
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
			log('INFO', '********** PZH Farm Intialized *********** ');
			callback(true);
		});

		farm.server.listen(8000);
	});
};

farm.addPzh = function( config) {
	pzh = pzh.createPzh(config);
	pzhs[config.servername] = pzh; 
	var options = {key: config.conn.key.value,
		cert: config.conn.cert.value,
		ca: config.master.cert.value,
		crl: config.master.crl.value,
		requestCert:true, 
		rejectUnauthorized:false
	};

	utils.setMessagingParam(pzh);
	if (typeof server === "undefined" || server === null) {
		log('ERROR', 'Farm is not running, please startFarm');
	} else {
		server.addContext(serverName, options);
	}
	
};