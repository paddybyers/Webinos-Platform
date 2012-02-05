
var tls = require('tls');

var initialized = true;

var CACERT = 0;

var pzhs = [];

var farm = exports;

/**
 * @description: It starts farm. 
 * @param config: Holds certificate details
 * @param callback: true in case successful or else false in case unsucessful
 */
farm.startFarm = function (config, callback) {
	if (initialized === true) {		
		cert.selfSigned( config.certDetails, 'PzhFarm', config, CACERT, 
		function(status, selfSignErr) {
			console.log(status);
			if(status === 'certGenerated') {
				var options = {key: config.key.value,
					cert: config.cert.value,
					ca: config.cert.value,
					requestCert: true };

				farm.server = tls.createServer (options, function (conn) {
					console.log(conn.servername);
					if (conn.servername && pzhs[conn.servername]) {
						console.log(' @pzhfarm@ sending message to ' + conn.servername);
						pzhs[conn.servername].handleConnectionAuthorization(pzhs[conn.servername], conn);
					} else {
						console.log('Server Is Not Registered in Farm');						
					}
					
					conn.on('data', function(data){
						console.log(' @pzhfarm@ msg received at farm');
						if(conn.servername && pzhs[conn.servername]) {
							pzhs[conn.servername].handleData(conn, data);
						}
					});

					conn.on('end', function(err) {
						helper.debug(2, ' @pzhfarm@ ' +conn.servername+' connection end' + err);
					});
					
					// It calls removeClient to remove PZP from connected_client and connectedPzp.
					conn.on('close', function() {
						try {
							helper.debug(2, '@pzhfarm@ ('+conn.servername+') Pzh/Pzp  closed');
							//var removed = utils.removeClient(self, conn);
							//self.messageHandler.removeRoute(removed, conn.servername);
						} catch (err) {
							helper.debug(1, '@pzhfarm@ ('+conn.servername+') Remove client from connectedPzp/connectedPzh failed' + err);
						}
					});
					
					conn.on('error', function(err) {
						helper.debug(1, '@pzhfarm@ ('+conn.servername+') General Error' + err);

					});
				});

				server.on('listening', function(){
					console.log('********** PZH Farm Intialized *********** ');
					callback(true);
				});

				server.listen(8000);
				initialized = false;				
			}
		});
	}
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
		ca
	}
		
	server.addContext(serverName, options);
	
};