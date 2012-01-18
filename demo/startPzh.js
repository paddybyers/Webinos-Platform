Pzh            = require('../webinos/pzh/lib/pzh_sessionHandling.js');
WebSocket      = require('../webinos/pzh/lib/pzh_websocket.js');

var ipAddr = 'localhost', port = 8000, serverPort = 8083, webServerPort = 8082;

process.argv.forEach(function(val, index, array) {
	if(index === 2) 
		ipAddr = val;
	else if (index === 3)
		port = val;
	else if (index === 4)
		webServerPort = val;
	else if (index === 5)
		serverPort = val;
});

var pzhModules = [
    {name: "get42", params: [99]}
];

if (ipAddr === '' || port <= 0) {
	console.log("Error starting server.\n\t Start with: node startPzh.js <host> <port> <webserverPort> <serverPort>) \n\t E.g.: node startPzh.js localhost 8000 8082 8083");
} else {
	var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=WebinosPzh\nemail=internal@webinos.org\ndays=180\n" ;
	WebSocket.startServer(ipAddr, serverPort, webServerPort, pzhModules, function() {
		Pzh.startPzh(contents, ipAddr, port, function() {
			console.log('=== PZH STARTED ===');
		});
	});
	
}

