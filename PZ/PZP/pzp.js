if (typeof webinos === "undefined") {
	webinos = {};
}

if (typeof exports !== "undefined") {
	webinos.session = require('../../Manager/Session/session_pzp.js');
} 

var servername = ' ', port = 0;

var WebSocketServer = require('websocket').server;
var WEBSOCKET_SERVER_PORT = 8080;
var WEBSERVER_PORT = 80;
var http = require("http");
var url = require("url");  
var path = require("path");
var fs = require("fs");

process.argv.forEach(function(val, index, array) {
	if(index === 2) 
		servername = val;
	if(index === 3)
		port = val;
});

if (servername === ' ' || port < 0) {
	console.log("PZP: Missing Details of server and port, enter node.js localhost 443");
} else {
	client = webinos.session.pzp.startPZP(servername, port);
	
	client.on('startedPZP', function() {
		this.emit('websocket_started','websocket started');
		var self = this;
		console.log(new Date());
		var cs = http.createServer(function(request, response) {  
			var uri = url.parse(request.url).pathname;  
			var filename = path.join(process.cwd(), uri);  
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
		})
	
		cs.on('error', function(err) {
			if (err.code == 'EADDRINUSE') {
				WEBSOCKET_SERVER_PORT += 1;
				WEBSERVER_PORT += 1;
				cs.listen(WEBSERVER_PORT,function(){
					console.log("PZP Web Server: is listening on port "+WEBSERVER_PORT);
				});
			}
		});

		cs.listen(WEBSERVER_PORT,function(){
			console.log("PZP Web Server: is listening on port "+WEBSERVER_PORT);
		});

		var httpserver = http.createServer(function(request, response) {
			console.log("PZP Websocket Server: Received request for " + request.url);
			response.writeHead(404);
	    		response.end();
		});
		httpserver.listen(WEBSOCKET_SERVER_PORT, function() {
			console.log("PZP Websocket Server: Listening on port "+WEBSOCKET_SERVER_PORT);
			self.emit('websocket_started','websocket started');
		});
		webinos.session.pzp.wsServer = new WebSocketServer({
			httpServer: httpserver,
			autoAcceptConnections: true
		});

		webinos.session.pzp.wsServer.on('connect', function(connection) {
			console.log("PZP Websocket Server: Connection accepted.");
			var id = webinos.session.pzp.getPZPSessionId()+ '::'+webinos.session.pzp.setServiceSessionId();
			webinos.message.registerSenderClient(id);
			webinos.session.pzp.connected_app[id] = connection;
			var options = {register: false, type: "prop", id: 0,
				from: webinos.session.pzp.getPZPSessionId(), to: id, resp_to: webinos.session.pzp.getPZHSessionId(),
				timestamp: 0, timeout:  null, payload: webinos.session.pzp.getOtherPZP()
			};
			connection.sendUTF(JSON.stringify(options));

			connection.on('message', function(message) {
				console.log('PZP websocket server received packet');
				// Each message is forwarded back to Message Handler to forward rpc message
				webinos.message.onMessageReceived(message.utf8Data, message.utf8Data.to);	
			});
			connection.on('close', function(connection) {
        			console.log("PZP Websocket Server: Peer " + connection.remoteAddress + " disconnected.");
	    		});
		});		
	});
}

