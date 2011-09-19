var xmpp = require('./xmpp');
var argv = process.argv;
var WebinosFeatures = require('./WebinosFeatures.js');
var logger = require('nlogger').logger('xmpp.js');

if (argv.length != 4) {
    console.error('Usage: pzpxmpp.js <my-jid> <my-password>');
    process.exit(1);
}

var connection = new xmpp.Connection();
connection.connect({ jid: argv[2], password: argv[3] }, function() {
	var geoFeature = WebinosFeatures.factory[WebinosFeatures.NS.GEOLOCATION]();
	
	geoFeature.on('invoked', function(feature, stanza) {
		logger.info('The feature is invoked! Answering it...');
		connection.answer(stanza, '<latitude>52.37</latitude><longitude>4.8</longitude>');
	});

	connection.shareFeature(geoFeature);
});


connection.on('end', function () {
	logger.info("Connection has been terminated. Stopping...");
	process.exit(1);
});

connection.on(WebinosFeatures.NS.GEOLOCATION, function(geolocationFeature) {
	logger.info("The feature " + geolocationFeature.ns + " on " + geolocationFeature.device + " became available.");
	
	// do something with the feature.
	geolocationFeature.on('remove', function(feature) {
		// do something when the feature is removed.
		logger.info("The feature " + feature.ns + " on " + feature.device + " became unavailable.");
	});
	
	connection.invokeFeature(geolocationFeature, function(resultCode, node) {
		if (resultCode === 'error') {
			logger.info("Got an error.");
		} else {
			logger.info("Got the result: " + node.getChild('query'));
		}
	});
});


