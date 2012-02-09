var tls         = require('tls');
var path        = require('path');
var util        = require('util');

var moduleRoot    = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies  = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot   = path.resolve(__dirname, '../' + moduleRoot.root.location);

var cert          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var utils         = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));
var log           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var configuration = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));

var farm = exports;
farm.pzhs =[];

/**
 * @description: It starts farm. 
 * @param config: Holds certificate details
 * @param callback: true in case successful or else false in case unsucessful
 */
farm.startFarm = function (url, contents, callback) {
	configuration.createDirectoryStructure();
	configuration.setConfiguration(contents, 'PzhFarm', function (config, conn_key) {
		
		var options = {key: conn_key,
			cert: config.conn.cert,
			ca:   config.master.cert,
			requestCert: true };

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
			log('INFO', '********** PZH Farm Intialized *********** ');
			callback(true);
		});

		farm.server.listen(8000);
	});
};

