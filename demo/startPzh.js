Pzh = require('../webinos/pzh/lib/session_pzh.js');

var ipAddr = 'localhost', port = 8000, serverPort = 8083, webServerPort = 8082;
process.argv.forEach(function(val, index, array) {
	if(index === 2) 
		ipAddr = val;
	else if (index === 3)
		port = val;
});

if (ipAddr === '' || port <= 0) {
	console.log("Error starting server.\n\t Start with: node startPzh.js <host> <port> \n\t E.g.: node startPzh.js localhost 8000");
} else {
	var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=WebinosPzh\nemail=internal@webinos.org\ndays=180\n" ;
	Pzh.startPzhWebSocketServer(ipAddr, serverPort, webServerPort);
	Pzh.startPzh(contents, ipAddr, port, function() {
		//console.log(Pzh);
	});
}

