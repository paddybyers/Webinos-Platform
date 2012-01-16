var pzhWebSocket = exports;

var path = require('path');
var instance = [];

if (typeof exports !== 'undefined') {
	var rpc = require(path.resolve(__dirname, '../../common/rpc/lib/rpc.js'));
	var RPCHandler = rpc.RPCHandler;
	var rpcHandler = new RPCHandler();
	var utils = require(path.resolve(__dirname, '../../pzp/lib/session_common.js'));
	var webinosDemo = path.resolve(__dirname, '../../../demo');
	var messaging = require(path.resolve(__dirname, '../../common/manager/messaging/lib/messagehandler.js'));
	messaging.setRPCHandler(rpcHandler);
	var revoker = require(path.resolve(__dirname, 'pzh_revoke.js'));
	var sessionPzh = require(path.resolve(__dirname, 'pzh_sessionHandling.js'));
	var helper = require(path.resolve(__dirname, 'pzh_helper.js'));
	var connectPzh = require(path.resolve(__dirname, 'pzh_connecting.js'));
}
pzhWebSocket.startServer = function(hostname, serverPort, webServerPort, modules, callback) {
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
					fs.writeFile(pzhOtherCertDir+'/'+pzh.config.otherPzh, parse.payload.message, function() {
						//pzh.conn.pair.credentials.context.addCACert(pzh.config.mastercertname);
						pzh.conn.pair.credentials.context.addCACert(parse.payload.message);
						var payload = pzh.prepMsg(null, null, 'receiveMasterCert', pzh.config.master.cert.value);
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
			callback();
		});
	} catch (err2) {
		utils.debug(1, 'PZH ('+pzh.sessionId+') Error WebSocket server Listening on Port' + err2);
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
				var pzh= sessionPzh.startPzh(msg.payload.value, msg.payload.servername,	msg.payload.serverport, 
					function(result) {
						if(result === 'startedPzh') {
							instance.push(pzh);
							var info = {"type":"prop","payload":{"status": "info","message":"PZH "+ pzh.sessionId+" started on port " + pzh.port}}; 
							connection.sendUTF(JSON.stringify(info));
						}				
					});
			} else if(instance.length > 0) {
				if(msg.type === "prop" && msg.payload.status === 'downloadCert') {
					for( i = 0 ; i < instance.length; i++) {
						if(instance[i].sessionId === msg.payload.name) {
							connectPzh.downloadCertificate(instance[i], msg.payload.servername, msg.payload.serverport);
							return;	
						}							
					}
				} else if(msg.type === "prop" && msg.payload.status === 'listPzh') {
					helper.connectedPzhPzp(connection);
				} else if(msg.type === "prop" && msg.payload.status === 'listAllPzps') {
					revoker.listAllPzps(pzhSignedCertDir, connection);
				} else if(msg.type === "prop" && msg.payload.status === 'addPzpQR') {
					helper.addPzpQR(connection);
				} else if(msg.type === "prop" && msg.payload.status === 'crashLog') {
					helper.crashLog(connection);
				} else if(msg.type === "prop" && msg.payload.status === 'revokePzp') {
				    revoker.revokePzp(connection, msg.payload.pzpid, instance[0], pzhCertDir, pzhSignedCertDir, pzhKeyDir, pzhRevokedCertDir);				
				}
			}
		});
	});
}
