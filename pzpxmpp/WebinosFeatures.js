var sys = require('sys');
var GeolocationFeature = require('./GeolocationFeature.js');
var RemoteAlertFeature = require('./RemoteAlertFeature.js');

var NS = {
	GEOLOCATION: 'http://webinos.org/api/geolocation',
	REMOTE_ALERT: 'http://webinos.org/api/remote-alert'
}

var factory = {
	'http://webinos.org/api/geolocation': function () { return new GeolocationFeature.GeolocationFeature },
	'http://webinos.org/api/remote-alert': function () { return new RemoteAlertFeature.RemoteAlertFeature }
}

exports.factory = factory;
exports.NS = NS;