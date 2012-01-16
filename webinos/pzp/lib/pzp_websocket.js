var websocket = exports;

var instance;

websocket.updateInstance = function(pzpInstance) {
	instance = pzpInstance;
}
websocket.startPzpWebSocketServer = function(hostname, serverPort, webServerPort, callback) {
		var http = require('http'),
		url = require('url'),
		path = require('path'),
		fs = require('fs'),
		webId = 0,
		moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
		dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json')),
		webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location),
		webinosDemo = path.resolve(__dirname, '../../../demo'),
		utils = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js')),
		WebSocketServer = require('websocket').server,
		rpc = require(path.join(webinosRoot, dependencies.rpc.location, 'lib/rpc.js')),
		messaging = require(path.join(webinosRoot, dependencies.manager.messaging.location, 'lib/messagehandler.js'));
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

		var cs = http.createServer(function(request, response) {  
			var uri = url.parse(request.url).pathname;  
			var filename = path.join(webinosDemo, uri);  
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
					response.writeHead(200, getContentType(filename));  
					response.write(file, "binary");  
					response.end();
				});
			});  
		});
	
		cs.on('error', function(err) {
			if (err.code === 'EADDRINUSE') {
				webServerPort = parseInt(webServerPort, 10) + 1;
				cs.listen(webServerPort, hostname); 
			}
		});

		cs.listen(webServerPort, hostname, function(){
			utils.debug(2, "PZP WebServer: Listening on port "+webServerPort);
		});

		var httpserver = http.createServer(function(request, response) {
			utils.debug(2, "PZP WSServer: Received request for " + request.url);
			response.writeHead(404);
			response.end();
		});

		httpserver.on('error', function(err) {
			utils.debug(1, "PZP WSServer: got error " + err);
			if (err.code === 'EADDRINUSE') {
				// BUG why make up a port ourselves?
				serverPort = parseInt(serverPort, 10) +1; 
				utils.debug(1, "PZP WSServer: address in use, now trying port " + serverPort);
				httpserver.listen(serverPort, hostname);
			}
		});

		httpserver.listen(serverPort, hostname, function() {
			utils.debug(2, "PZP WSServer: Listening on port "+serverPort + " and hostname "+hostname);
			callback("started");

		});

		var wsServer = new WebSocketServer({
			httpServer: httpserver,
			autoAcceptConnections: true
		});
		
		function messageWS (msg, address) {
			msg.from = "virgin_pzp";
			// TODO why is "msg" a whole service object? we should only send the service info fields.
			if(connectedApp[address]) {
				connectedApp[address].sendUTF(JSON.stringify(msg));
			}
		}
		
		function connectedApp (connection) {			
			if(typeof instance !== "undefined" && typeof instance.sessionId !== "undefined") {
				instance.sessionWebAppId  = instance.sessionId+ '/'+ instance.sessionWebApp;
				instance.sessionWebApp  += 1;
				instance.connectedWebApp[instance.sessionWebAppId] = connection;
				payload = {'pzhId':instance.pzhId,'connectedPzp': instance.connectedPzpIds,'connectedPzh': instance.connectedPzhIds};
				instance.prepMsg(instance.sessionId, instance.sessionWebAppId, 'registeredBrowser', payload);  
			} else {
				webId += 1;
				var payload, addr = "virgin_pzp"+'/'+webId;
				connectedApp[addr] = connection;
				payload = {type:"prop", from:"virgin_pzp", to: addr , payload:{status:"registeredBrowser"}};
				messageWS(payload, addr);
			}		
		}
		
		wsServer.on('connect', function(connection) {
			utils.debug(2, "PZP WSServer: Connection accepted.");
			connectedApp(connection);
			
			connection.on('message', function(message) {
				//schema validation
				var msg;
				//if(utils.checkSchema(message.utf8Data) === false){
					msg = JSON.parse(message.utf8Data);
				//}else {
				//	throw new Error('Unrecognized packet');	
				//}
				utils.debug(2, 'PZP WSServer: Received packet ' + JSON.stringify(msg));

				// Each message is forwarded back to Message Handler to forward rpc message
					if(msg.type === 'prop' ){
						if( msg.payload.status === 'startPzp' ) {
						instance = sessionPzp.startPzp(msg.payload.value, 
						msg.payload.servername, 
						msg.payload.serverport,
						msg.payload.code,
						msg.payload.modules,
						function(status) {
							if(typeof status !== "undefined") {
								connectedApp(connection);
								instance.wsServerMsg("Pzp " + instance.sessionId+ " started");
							}
						});
					} else if(msg.payload.status === 'disconnectPzp') {
						if( typeof instance !== "undefined" && typeof instance.sessionId !== "undefined") {
							if(instance.connectedPzp.hasOwnProperty(instance.sessionId)) {
								instance.connectedPzp[instance.sessionId].socket.end();
								instance.wsServerMsg("Pzp "+instance.sessionId+" closed");
							}
						}
					}
					else if(msg.payload.status === 'registerBrowser') {
						connectedApp(connection);
					}
				} else {
					if( typeof instance !== "undefined" && typeof instance.sessionId !== "undefined") {
						rpc.SetSessionId(instance.sessionId);
						utils.sendMessageMessaging(instance, msg);
					} else {
						rpc.SetSessionId("virgin_pzp");
						messaging.setGetOwnId("virgin_pzp");
						messaging.setSendMessage(messageWS);
						messaging.setSeparator("/");
						messaging.onMessageReceived(msg, msg.to);
					}
				}
			});
			connection.on('close', function(connection) {
					utils.debug(2, "PZP WSServer: Peer " + connection.remoteAddress + " disconnected.");
			});	
		});
		
	};
