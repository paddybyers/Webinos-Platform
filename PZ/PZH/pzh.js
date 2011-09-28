if (typeof webinos === "undefined") webinos = {};
if (typeof exports !== "undefined") session = require('../../Manager/Session/session_pzh.js');
else session = webinos.session;

var servername=' ', port = 0;

process.argv.forEach(function(val, index, array) {
	if (index === 2) 
		servername = val;
	if(index === 3)
		port = val;
		
});

if (servername === ' ' || port < 0) {
	console.log("Missing Details of server and port, enter node.js localhost 443");
} else { 
	webinos.session.pzh.startPZH(servername, port);
}
