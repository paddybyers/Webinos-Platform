var xmpp = require('./xmpp');
var argv = process.argv;

if (argv.length != 4) {
    console.error('Usage: pzpxmpp.js <my-jid> <my-password>');
    process.exit(1);
}

var connection = new xmpp.Connection();
connection.connect({ jid: argv[2], password: argv[3] }, function() {
	connection.addFeature(NS.GEOLOCATION);
});

connection.onEnd(function () {
		console.log("Connection terminated. Stopping...");
		process.exit(1);
});
	
var NS = {
	GEOLOCATION: 'http://webinos.org/api/geolocation',
	REMOTE_ALERT: 'http://webinos.org/api/remote-alert'
}
		
connection.findServices({api: NS.GEOLOCATION}, function() {
		console.log("blaat");
	}
);
