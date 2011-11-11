/* Currently PZP/PZH has websocket server in it, later it will be moved to Session PZP. 
 * It creates a PZP Web Socket server. It is responsible for generating id for the
 * apps and broadcasting to all clients. All other messages received are forwarded
 * to message handler.
 */
if (typeof webinos === "undefined") {
	webinos = {};
	webinos.session = {};
};
webinos.session.pzh = require('./session_pzh.js');

var hostname = '' , serverPort = 0,  webServerPort = 0;;
process.argv.forEach(function(val, index, array) {
	if(index === 2) 
		hostname = val;
	else if (index === 3)
		serverPort = val;
	else if(index === 4)
		webServerPort = val;
});

webinos.session.pzh.startWebSocketServer(hostname, serverPort, webServerPort); 
