if (typeof webinos === "undefined") webinos = {};
if (typeof exports !== "undefined")	 session = require('../../Manager/Session/session_pzh.js');
else session = webinos.session;
var fs = require('fs');
var servername = null, port = null, otherPzh = 0;

process.argv.forEach(function(val, index, array) {
	if (index === 2) 
		servername = val;
	if(index === 3)
		port = val;
	if(index === 4)
		otherPzh = val;
		
});

if (servername === null || port === null) {
	console.log("Missing Details of server and port, enter node.js localhost 443");
} else { 
	server = webinos.session.pzh.startPZH(servername, port);
	server.on('startedPZH', function() {
		console.log('connecting other pzh');
		var options  = {key: fs.readFileSync('master-server-key.pem'),
			cert: fs.readFileSync('master-server-cert.pem'),
			ca: fs.readFileSync('master-server-cert.pem')};

		//webinos.session.pzh.connectOtherPZH(servername, otherPzh, options);
	});
}
