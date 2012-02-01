/**
 * Place holder for all webinos features. This class hold all the namespaces and factories that create
 * feature classes.
 * 
 * Author: Eelco Cramer, TNO
 */

var sys = require('util');
var GeolocationFeature = require('./GeolocationFeature.js');
var Get42Feature = require('./Get42Feature.js');

var NS = {
	GEOLOCATION: GeolocationFeature.NS,
	GET42: Get42Feature.NS
}

var factory = {
	'urn:services-webinos-org:geolocation': function (rpcHandler) { return new GeolocationFeature.GeolocationFeature(rpcHandler) },
	'urn:services-webinos-org:get42': function (rpcHandler) { return new Get42Feature.Get42Feature(rpcHandler) }
}

exports.factory = factory;
exports.NS = NS;