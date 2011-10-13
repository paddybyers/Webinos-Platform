/* Currently it has websocket server in it, later it will be moved to Session PZP. 
 * It creates a PZP Web Socket server. It is responsible for generating id for the
 * apps and broadcasting to all clients. All other messages received are forwarded
 * to message handler.
 */
if (typeof webinos === "undefined") {
	webinos = {};
}

if (typeof exports !== "undefined") {
	webinos.session = require('../../Manager/Session/session_pzp.js');
} 

var servername = ' ', port = 0, serverPort = 0, webServerPort = 0, webSocketServer = false;


process.argv.forEach(function(val, index, array) {
	if(index === 2) 
		servername = val;
	if(index === 3)
		port = val;
	if(index === 4)
		webSocketServer = val;
	if(index === 5)
		serverPort = val;
	if(index === 6)
		webServerPort = val;	
});

if (servername === ' ' || port < 0) {
	console.log("PZP: Missing Details of server and port, enter node.js localhost 443");
} else {
	var client = webinos.session.pzp.startPZP(servername, port);
	
	client.on('startedPZP', function() {
		if(webSocketServer === 'true') {
			if (serverPort === 0 || webServerPort === 0) {
				console.log('PZP: Missing port number');
			} else {
				console.log('PZP: Starting WebSocket Server');
				webinos.session.pzp.startWebSocketServer(serverPort, webServerPort); 
			}
		}
			
	});
}

