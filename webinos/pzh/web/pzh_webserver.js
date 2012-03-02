var pzhWebInterface = exports;

var https    = require('https');
var openid   = require('openid');
var url      = require('url');
var querystr = require('querystring');
var path     = require('path');
var fs       = require('fs');
var webSocket= require('websocket').server;

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);

var pzhapis      = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_internal_apis.js'));
var farm         = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_farm.js'));
var log          = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')).debug;
var configure    = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_configuration.js'));
var cert         = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));

var authorized   = false;
var rely ;
var connection;
var pzh;
// Create HTTPS Server
pzhWebInterface.start = function(hostname) {
	createWebInterfaceCertificate(farm.config, function(webServer, wssServer){
		console.log(webServer);
		console.log(wssServer);
		var server = https.createServer(webServer, function(req, res){
			var parsed = url.parse(req.url);
			var query = querystr.parse(parsed.query);
			if (query.id === 'verify'){
				fetchOpenIdDetails(req);
				res.writeHead(302, {Location: '/main.html'});
				res.end();

			} else {
				var filename = path.join(__dirname, parsed.pathname);
				path.exists(filename, function(exists) {
					if(!exists) {
						res.writeHeader(404, {"Content-Type": "text/plain"});
						res.write("404 Not Found\n");
						res.end();
						return;
					}
					// Security check, if not logged in, we redirect to index.html
					if(!authorized){
						filename = '/index.html';
					}
					fs.readFile(filename, "binary", function(err, file) {
						if(err) {
							res.writeHeader(500, {"Content-Type": "text/plain"});
							res.write(err + "\n");
							res.end();
							return;
						}

						res.writeHeader(200, getContentType(filename));
						res.write(file, "binary");
						res.end();
					});
				});
			}
		});

		server.listen(configure.webServerPort, hostname, function() {
			log('INFO','[WEB SERVER] STARTED on '+ configure.webServerPort);
		});

		server.on('error', function(err) {
			log('INFO','[WEB SERVER] Server Error' + err);
		});

		var httpsServer = https.createServer(wssServer, function(request, response) {
			response.writeHead(404);
			response.end();
		});

		httpsServer.listen(configure.httpServerPort, hostname, function(){
			log('INFO','[WEB SERVER] Http Server listening on '+ configure.httpServerPort);
		});

		var wsServer = new webSocket({
			httpServer: httpsServer,
			autoAcceptConnections: true
		});

		wsServer.on('connect', function(conn) {
			connection = conn;
			log('INFO','[WEB SERVER] '+connection.remoteAddress + ' connected ');
			// TODO: Send only to main.html and not to all .. 
			if (typeof pzh !== "undefined"){
				pzhapis.listZoneDevices(pzh, result);
			}
			connection.on('message', function(data) {
				console.log('received data :: ' + (data.utf8Data));
				var parse = JSON.parse((data.utf8Data));
				if (parse.cmd) {
					switch(parse.cmd){
						case 'authenticate-google':
							authenticate('http://www.google.com/accounts/o8/id');
							break;
						case 'userDetails':
							result({cmd:'userDetails', payload:pzh.config.userDetails});
							break;
						case 'addPzp':
							pzhapis.addPzpQR(pzh, result);
							break;
						case 'logout':
							connection.close();
							break;
						case 'restartPzh':
							pzhapis.restartPzh(pzh, result);
							break;
						case 'connectPzh':
							pzhapis.connectPzh(pzh, result);
							break;
					}
				}
			});
			connection.on('close', function(connection) {
				log('INFO','[WEB SERVER] Connection Closed');
			});
		});

		wsServer.on('error', function(err) {
			log('INFO','[WEB SERVER] Error '+ err);
		})
	});
}

function getContentType(uri) {
	var contentType = 'text/plain';
	switch (uri.substr(uri.lastIndexOf('.'))) {
		case '.js':
			contentType = 'application/x-javascript';
			break;
		case '.html':
			contentType = 'text/html';
			break;
		case '.css':
			contentType = 'text/css';
			break;
		case '.jpg':
			contentType = 'image/jpeg';
			break;
		case '.png':
			contentType = 'image/png';
			break;
		case '.gif':
			contentType = 'image/gif';
			break;
	}
	return {'Content-Type': contentType};
}
function result(response) {
	console.log(response);
	connection.send(JSON.stringify(response));	
}
 
function authenticate(url) {
	var exts= [];
	var attr = new openid.AttributeExchange({
		"http://axschema.org/contact/country/home":	"required",
		"http://axschema.org/namePerson/first":		"required",
		"http://axschema.org/pref/language":		"required",
		"http://axschema.org/namePerson/last":		"required",
		"http://axschema.org/contact/email":		"required",
		"http://axschema.org/namePerson/friendly":	"required",
		"http://axschema.org/namePerson":		"required",
		"http://axschema.org/media/image/default":	"required",
		"http://axschema.org/person/gender/":		"required"
	});
	exts.push(attr);

	rely = new openid.RelyingParty('https://localhost/main.html?id=verify',
		null,
		false,
		false,
		exts);
	
	openid.discover('http://www.google.com/accounts/o8/id', function(error, providers){
		rely.authenticate('http://www.google.com/accounts/o8/id', false, function(error, authUrl) {
			if(error){
				log('INFO','[WEB SERVER] Error '+ error);			
			} else if (!authUrl) {
				console.log('Authentication failed as url to redirect after authentication is missing');
			} else {                                                                                      
				connection.send(JSON.stringify({cmd:'auth-url', payload: authUrl}));
			}
		});
	});
}

function fetchOpenIdDetails(req){
	rely.verifyAssertion(req, function(err, userDetails){
		if (err){
			console.log(err.message);
		}
		else {
			var host;
			if(req.headers.host.split(':')){
				host = req.headers.host.split(':')[0];
			} else {
				host = req.headers.host;
			}
			authorized = true;
			farm.getPzhInstance(host, userDetails, function(pzhInt){
				pzh = pzhInt;
				pzhapis.listZoneDevices(pzh, result);
			});
			
		}
	});
}

/**
 * @description: Starts web interface for PZH farm
 * @param {config} certificate configuration parameters
 * */
function createWebInterfaceCertificate (config, callback) {
	if (config.webServer.cert === "") {
		cert.selfSigned( 'PzhWebServer', config.certValues, function(status, selfSignErr, ws_key, ws_cert, csr ) {
			if(status === 'certGenerated') {
				configure.fetchKey(config.master.key_id, function(master_key) {
					cert.signRequest(csr, master_key,  config.master.cert, 1, function(result, cert) {
						if(result === 'certSigned') {
							config.webServer.cert = cert;
							configure.storeKey(config.webServer.key_id, ws_key);
							configure.storeConfig(config);
						}
					});
				});
			} else {
				log('ERROR', '[WEB SERVER] Certificate generation error')
			}
		});
	}
	if (config.webSocketServer.cert === "") {
		cert.selfSigned( 'PzhWebSocketServer', config.certValues, function(status, selfSignErr, ws_key, ws_cert, csr ) {
			if(status === 'certGenerated') {
				configure.fetchKey(config.master.key_id, function(master_key) {
					cert.signRequest(csr, master_key,  config.master.cert, 1, function(result, cert) {
						if(result === 'certSigned') {
							config.webSocketServer.cert = cert;
							configure.storeKey(config.webSocketServer.key_id, ws_key);
							configure.storeConfig(config);
						}
					});
				});
			} else {
				log('ERROR', '[WEB SERVER] Certificate generation error')
			}
		});
	}

	if (config.webSocketServer.cert !== "" && config.webServer !== ""){
		var wss = {
			key : '',
			cert: config.webServer.cert,
			ca  : config.master.cert
		};
		var wss1 = {
			key : '',
			cert: config.webSocketServer.cert,
			ca  : config.master.cert
		};
		configure.fetchKey(config.webServer.key_id, function(ws_key){
			wss.key = ws_key;
			configure.fetchKey(config.webSocketServer.key_id, function(wss_key){
				wss1.key = wss_key;
				callback(wss, wss1);
			});
		});
	}
}