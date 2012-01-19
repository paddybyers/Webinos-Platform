var pzhWebSocket = exports;

var path         = require('path');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var webinosDemo  = path.resolve(__dirname, '../../../demo');

var rpc        = require(path.join(webinosRoot, dependencies.rpc.location));
var RPCHandler = rpc.RPCHandler;
var rpcHandler = new RPCHandler();

var messaging  = require(path.join(webinosRoot, dependencies.manager.messaging.location, 'lib/messagehandler.js'));
messaging.setRPCHandler(rpcHandler);

var pzh_session = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_sessionHandling.js'));
var authcode    = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_authcode.js'));
var websocket   = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_websocket.js'));	
var revoker     = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_revoke.js'));	
var helper      = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_helper.js'));
var connect_pzh = require(path.join(webinosRoot, dependencies.pzh.location, 'lib/pzh_connecting.js'));

var cert        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var utils       = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));

pzhWebSocket.instance = [];

pzhWebSocket.startServer = function(hostname, serverPort, webServerPort, modules, callback) {
	var fs = require('fs');
	try {
		var http = require('http'),			
		WebSocketServer = require('websocket').server;
	} catch (err) {
		utils.debug(1, 'PZH WebSocket Server modules missing. Http and WebSocketServer are main dependencies ' + err);
		return;
	}
	
	// load specified modules
	rpcHandler.loadModules(modules);
	
	var cs = http.createServer(function(request, response) { 
		var url, uri, filename;
		try {
			url = require('url');
			uri = url.parse(request.url).pathname;  
			filename = path.join(webinosDemo, uri);
		} catch (err) {
			utils.debug(1, 'PZH resolving URL/URI for file requested ' + err);
			return;
		}
		
		path.exists(filename, function(exists) {  
			if(!exists) {  
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("404 Not Found\n");
				response.end();
				return;
			}  
			fs.readFile(filename, "binary", function(err, file) {  
				if(err) {  
					response.writeHead(500, {"Content-Type": "text/plain"});  
					response.write(err + "\n");  
					response.end();  
					return;  
				}
				response.writeHead(200);  
				response.write(file, "binary");  
				response.end();
				});
		});  
	});
		 
	cs.on('error', function(err) {
		if (err.code === 'EADDRINUSE') {
			webServerPort = parseInt(webServerPort, 10) + 1;
			cs.listen(webServerPort, hostname); 
		} else {
			utils.debug(1, 'PZH ('+pzh.sessionId+') General Pzh WebSocket Server Error' + err);
			return;	
		}
	});

	try {
			cs.listen(webServerPort, hostname, function(){
				utils.debug(2, 'PZH WebServer: Listening on port ' +webServerPort);
			});
	} catch (err1) {
		utils.debug(1, 'PZH ('+pzh.sessionId+') Error listening on Port' + err1);	
		return;	
	}

	var httpserver = http.createServer(function(request, response) {	
		request.on('data', function(chunk) {
			utils.processedMessage(chunk, function(parse){
				try {
					fs.writeFile(pzhWebsocket.instance[0].config.pzhOtherCertDir+'/'+parse.payload.message.name, parse.payload.message.cert, function() {
						//pzh.conn.pair.credentials.context.addCACert(pzh.config.mastercertname);
						pzhWebSocket.instance[0].conn.pair.credentials.context.addCACert(parse.payload.message.cert);
						var msg = {name: pzhWebSocket.instance[0].config.master.cert.name , 
									cert: pzhWebSocket.instance[0].config.master.cert.value};
						var payload = pzhWebSocket.instance[0].prepMsg(null, null, 'receiveMasterCert', msg);
						
						utils.debug(2, 'PZH  WSServer: Server sending certificate '+ JSON.stringify(payload).length);
						
						response.writeHead(200);
						response.write('#'+JSON.stringify(payload)+'#\n');
						response.end();
					});
				} catch (err) {
					utils.debug(1, 'PZH ('+pzh.sessionId+') Error Writing other Pzh certificate ' + err);
					return;
				}
			});

		});
		
		request.on('end', function() {
			utils.debug(2, 'PZH WSServer: Message End');

		});
		
	});

	httpserver.on('error', function(err) {
		if (err.code === 'EADDRINUSE') {
			serverPort = parseInt(serverPort, 10) +1; 
			httpserver.listen(serverPort, hostname);
		}
	});
	
	try {
		httpserver.listen(serverPort, hostname, function() {
			utils.debug(2, 'PZH WSServer: Listening on port '+serverPort + ' and hostname '+hostname);
			callback(true);
		});
	} catch (err2) {
		utils.debug(1, 'PZH ('+pzh.sessionId+') Error WebSocket server Listening on Port' + err2);
		callback(false);
		return;
	}

	var wsServer = new WebSocketServer({
		httpServer: httpserver,
		autoAcceptConnections: true
	});

	wsServer.on('connect', function(connection) {
		utils.debug(2, 'PZH WSServer: Connection accepted.');
		connection.on('message', function(message) {
			// schema validation
			//var msg = utils.checkSchema(message.utf8Data);
			
			var msg = JSON.parse(message.utf8Data);
			utils.debug(2, 'PZH WSServer: Received packet' + JSON.stringify(msg));
			
			if(msg.type === 'prop' && msg.payload.status === 'startPzh') {
				pzh = pzh_session.startPzh(msg.payload.value, msg.payload.servername, msg.payload.serverport, 
					function(result) {
						if(result === 'startedPzh') {
							pzhWebSocket.instance.push(pzh);
							var info = {"type":"prop","payload":{"status": "info","message":"PZH "+ pzh.sessionId+" started on port " + pzh.port}}; 
							connection.sendUTF(JSON.stringify(info));
						}				
					});
			} else if(pzhWebSocket.instance.length > 0) {
				if(msg.type === "prop" && msg.payload.status === 'downloadCert') {
					for( i = 0 ; i < pzhWebSocket.instance.length; i++) {
						if(pzhWebSocket.instance[i].sessionId === msg.payload.name) {
							connect_pzh.downloadCertificate(pzhWebSocket.instance[i], msg.payload.servername, msg.payload.serverport);
							return;	
						}							
					}
				} else if(msg.type === "prop" && msg.payload.status === 'listPzh') {
					helper.connectedPzhPzp(pzhWebSocket.instance, function(msg){
						connection.sendUTF(JSON.stringify(msg));
					});
				} else if(msg.type === "prop" && msg.payload.status === 'listAllPzps') {
					revoker.listAllPzps(pzhWebSocket.instance[0].config.pzhSignedCertDir, function(result) {
						connection.sendUTF(JSON.stringify(result));
					});					
				} else if(msg.type === "prop" && msg.payload.status === 'addPzpQR') {
					helper.addPzpQR(pzhWebSocket.instance, connection);
				} else if(msg.type === "prop" && msg.payload.status === 'crashLog') {
					helper.crashLog(pzhWebSocket.instance, function(msg) {
						connection.sendUTF(JSON.stringify(msg));
					});
				} else if(msg.type === "prop" && msg.payload.status === 'revokePzp') {
				    revoker.revokePzp(msg.payload.pzpid, pzhWebSocket.instance[0], function(msg) {
	    				connection.sendUTF(JSON.stringify(msg));
				    });				
				} else if(msg.type === "prop" && msg.payload.status === 'revokeClientList') {
				    revoker.listAllPzps(pzhWebSocket.instance[0].config.pzhRevokedCertDir, function(msg){
	    				connection.sendUTF(JSON.stringify(msg));
				    });
				} else if(msg.type === "prop" && msg.payload.status === 'restartPzh') {
				    pzh_session.restartPzh(pzhWebSocket.instance[0], function(msg) {
				    	connection.sendUTF(JSON.stringify(msg));
				    });
				}
			}
		});
	});
}
