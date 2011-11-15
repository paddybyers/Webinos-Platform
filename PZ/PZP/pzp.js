/* Currently it has websocket server in it, later it will be moved to Session PZP. 
 * It creates a PZP Web Socket server. It is responsible for generating id for the
 * apps and broadcasting to all clients. All other messages received are forwarded
 * to message handler.
 */
var sessionPzp = require('./session_pzp.js');

var serverName = '', serverPort = 0, webServerPort = 0;
process.argv.forEach(function(val, index, array) {
	if(index === 2)
		serverName = val;
	if(index === 3) 
		serverPort = val;
	if(index === 4)
		webServerPort = val;
});

if (serverName === '' || serverPort <= 0 || webServerPort <= 0) {
	console.log("pzp.js: Error starting server.\n\t Start with: node pzp.js <host> <websocket port> <http port>\n\t E.g.: node pzp.js localhost 81 80");
} else {
	sessionPzp.startWebSocketServer(serverName, serverPort, webServerPort);
}
