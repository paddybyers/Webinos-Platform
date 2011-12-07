/**
 * The geolocation feature.
 * 
 * Reused and updated the orginal XmppDemo code of Victor Klos
 * Author: Eelco Cramer, TNO
 */

var GenericFeature = require('./GenericFeature.js');
var sys = require('util');
var rpc = require("../../rpc/lib/rpc.js");
var logger = require('nlogger').logger('GeolocationFeature.js');

/*
 * Geolocation feature, defined as subclass of GenericFeature
 *
 * When an app invokes this service, a query request is sent to the 
 * service (address). The result is passed back through a callback.
 *
 * See the XMPP logging for the details.
 */

var NS = "urn:services-webinos-org:geolocation";

function GeolocationFeature() {
	GenericFeature.GenericFeature.call(this);

	this.api = NS;
	this.displayName = "GeolocationFeature" + this.id;
	this.description = 'Geolocation Feature.';
	this.ns = this.api;
	
	this.on('invoked-from-remote', function(featureInvoked, stanza) {
		logger.trace('on(invoked-from-remote)');
		logger.debug('The GeolocationFeature is invoked from remote. Answering it...');
		logger.debug('Received the following XMPP stanza: ' + stanza);
		
		var query = stanza.getChild('query');
		var params = query.getText();
		
		if (params == null || params == '') {
			params = "{}";
		} else {
			logger.trace('Query="' + params + '"');
		}
		
		var payload = JSON.parse(params);
		var conn = this.uplink;

		this.getCurrentPosition(payload, function(result) {
			logger.debug("The answer is: " + JSON.stringify(result));
			logger.debug("Sending it back via XMPP...");
			conn.answer(stanza, JSON.stringify(result));
		});

		logger.trace('ending on(invoked-from-remote)');
	});

	this.on('invoked-from-local', function(featureInvoked, params, successCB, errorCB, objectRef) {
		logger.trace('on(invoked-from-local)');
		this.getCurrentPosition(params, successCB, errorCB, objectRef);
		logger.trace('ending on(invoked-from-local)');
	});
	
	this.getCurrentPosition = function(params, successCB, errorCB, objectRef) {
	  	if (params['method'] == "native") {	
			var util = require('util');
		    var exec = require('child_process').exec;
		    var child;
			var location = null;

			childCB = function (error, stdout, stderr) {
			    location = stdout;
				successCB(location);
			    if (error !== null) {
			    	console.log('exec error: ' + error);
			    }
			}
			child = exec('echo this is your location', childCB); 	// see http://nodejs.org/docs/v0.5.4/api/child_processes.html	

		} else { 

			var result={};
			var http = require('http');
			var freegeoip = http.createClient(80, 'freegeoip.net');
			var request = freegeoip.request('GET', '/json/',
			  {'host': 'freegeoip.net'});
			request.end();
			request.on('response', function (response) {
			  // console.log('STATUS: ' + response.statusCode);
			  // console.log('HEADERS: ' + JSON.stringify(response.headers));
			  response.setEncoding('utf8');
			  response.on('data', function (chunk) {
			    // console.log('BODY: ' + chunk);
			    result = JSON.parse(chunk);
				location = { 'lat': result['latitude'], 'lon': result['longitude'] };
				successCB(location);
			  });
			});		
		}
	}
	
	//TODO 'this' exposes all functions (and attributes?) to the RPC but only some a selection of features should be exposed.
	//TODO remote clients use the function 'invoke' to invoke the geolocation feature but it should also be possible to have other functions.
	//     at this time invoke is handled by the GenericFeature to dispatch the call locally or remotely.
	
	// We add the 'id' to the name of the feature to make this feature unique to the client.
	webinos.rpc.registerObject(this);  // RPC name
}

sys.inherits(GeolocationFeature, GenericFeature.GenericFeature);
exports.GeolocationFeature = GeolocationFeature;
exports.NS = NS;

////////////////////////// END Geolocation Feature //////////////////////////

