pzp = require('../webinos/pzp/lib/session_pzp.js');

var ipAddr = '127.0.0.1' , port = 8000, serverPort = 8081, webServerPort = 8080;
process.argv.forEach(function(val, index, array) {
	if(index === 2) 
		ipAddr = val;
	else if (index === 3)
		port = val;
	else if (index === 4)
		serverPort = val;
	else if (index === 5)
		webServerPort = val;
});

var pzpModules = {};
pzpModules.list = [
	"service_discovery",
    "get42",
    "file",
    "geolocation",
    "events",
    "sensors",
    "tv",
    "deviceorientation",
    "vehicle",
    "context",
    "authentication",
    "contacts"
];

if (ipAddr === '' || port <= 0) {
	console.log("Error starting Pzp.\n\t Start with: node startPzp.js <host> <port> \n\t E.g.: node startPzp.js localhost 8000 8081 8080");
} else {
	var contents ="pzh_name=localhost\ncountry=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=WebinosPzp\nemail=internal@webinos.org\ndays=180\n"
	pzp.startPzpWebSocketServer(ipAddr, serverPort, webServerPort, pzpModules);
	pzp.startPzp(contents, ipAddr, port, function() {
		//console.log(pzp);
	});
}

