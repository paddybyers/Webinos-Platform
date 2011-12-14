/* Currently PZP/PZH has websocket server in it, later it will be moved to Session PZP. 
 * It creates a PZP Web Socket server. It is responsible for generating id for the
 * apps and broadcasting to all clients. All other messages received are forwarded
 * to message handler.
 */
console.log("DEBUG env", process.env.WEBINOS_PATH);
 
if (typeof webinos === "undefined") {
	webinos = {};
	webinos.session = {};
}
webinos.session.pzp = require('../webinos/pzp/lib/session_pzp.js');

var hostname = '' , serverPort = 0, webServerPort = 0;
process.argv.forEach(function(val, index, array) {
	if(index === 2) 
		hostname = val;
	else if (index === 3)
		serverPort = val;
	else if(index === 4)
		webServerPort = val;
});

if (hostname === '' || serverPort <= 0 || webServerPort <= 0) {
	console.log("pzp.js: Error starting server.\n\t Start with: node websocket_server.js <host> <websocket port> <http port>\n\t E.g.: node websocket_server.js localhost 81 80");
} else {
	webinos.session.pzp.startWebSocketServer(hostname, serverPort, webServerPort); 
}
