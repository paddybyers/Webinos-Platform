pzp = require('../webinos/pzp/lib/session_pzp.js');

var ipAddr = 'localhost' , port = 8000, webServerPort = 8080, serverPort = 8081;
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
	console.log("Error starting Pzp.\n\t Start with: node startPzp.js <host> <port> <webServerPort> <serverPort> \n\t E.g.: node startPzp.js localhost 8000 8080 8081");
} else {
	var contents ="pzh_name=localhost\ncountry=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=WebinosPzp\nemail=internal@webinos.org\ndays=180\n"
	pzp.startPzpWebSocketServer(ipAddr, serverPort, webServerPort, pzpModules);
	pzp.startPzp(contents, ipAddr, port, function() {
		//console.log(pzp);
	});
}

