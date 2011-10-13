// This is responsible for taking parameters such as localhost and port number to instantiate PZH server.

if (typeof webinos === "undefined") webinos = {};
if (typeof exports !== "undefined")	 session = require('../../Manager/Session/session_pzh.js');

var fs = require('fs');
var servername=' ', port = 0, otherPzh = 0, httpsServer = 0;

process.argv.forEach(function(val, index, array) {
	if (index === 2) 
		servername = val;
	if(index === 3)
		port = val;
	if(index === 4)
		otherPzh = val;
	if(index === 5)
		httpsServer = val;
		
});

if (servername === ' ' && port < 0) {
	console.log("Missing Details of server and port, enter node.js localhost 443");
} else { 
	server = webinos.session.pzh.startPZH(servername, port);
	// Instantiate and connect to other PZH server
	server.on('startedPZH', function() {
		webinos.session.pzh.startHttpsServer(httpsServer);
	});
}
