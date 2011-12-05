var GenericFeature = require('./GenericFeature.js');
var sys = require('sys');

/*
 * Geolocation feature, defined as subclass of GenericFeature
 *
 * When an app invokes this service, a query request is sent to the 
 * service (address). The result is passed back through a callback.
 *
 * See the XMPP logging for the details.
 */
function GeolocationFeature() {
	GenericFeature.GenericFeature.call(this);
	
    this.ns = "http://webinos.org/api/geolocation";
    this.name = "geolocation";
}

sys.inherits(GeolocationFeature, GenericFeature.GenericFeature);
exports.GeolocationFeature = GeolocationFeature;

////////////////////////// END Geolocation Feature //////////////////////////

