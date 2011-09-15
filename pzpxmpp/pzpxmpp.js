var xmpp = require('./xmpp');
var argv = process.argv;
var WebinosFeatures = require('./WebinosFeatures.js');


if (argv.length != 4) {
    console.error('Usage: pzpxmpp.js <my-jid> <my-password>');
    process.exit(1);
}

var connection = new xmpp.Connection();
connection.connect({ jid: argv[2], password: argv[3] }, function() {
	var geoFeature = WebinosFeatures.factory[WebinosFeatures.NS.GEOLOCATION]();
	connection.shareFeature(geoFeature);
});


connection.on('end', function () {
	console.log("Connection terminated. Stopping...");
	process.exit(1);
});

connection.on(WebinosFeatures.NS.GEOLOCATION, function(geolocationFeature) {
	console.log("added.");
	// do something with the feature.
	geolocationFeature.on('remove', function(feature) {
		// do something when the feature is removed.
		console.log("removed.")
	});
});


