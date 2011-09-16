var ltx = require('ltx');
var sys = require('sys');
var xmpp = require('node-xmpp');
var hashlib = require("./libs/hashlib");
var nodeType = 'http://webinos.org/pzp';
var connection;
var EventEmitter = require('events').EventEmitter;
var WebinosFeatures = require('./WebinosFeatures.js');
var logger = require('nlogger').logger('xmpp.js');

//TODO make members and functions that should be private private

function Connection() {
	EventEmitter.call(this);
	
	connection = this;

	this._uniqueId = Math.round(Math.random() * 10000);

	this.basicFeatures = ["http://jabber.org/protocol/caps", 
				 	 	  "http://jabber.org/protocol/disco#info",
                   	 	  "http://jabber.org/protocol/commands"];
    
	this.callbacks = {};         // administration of callbacks for all service types
    this.sharedFeatures = {};    // services that the app wants shared
    this.remoteFeatures = {};    // services that are shared with us, assoc array of arrays
    this.pendingRequests = {};   // hash to store <stanza id, geo service> so results can be handled
    this.featureMap = {};        // holds features, see initPresence() for explanation
}

sys.inherits(Connection, EventEmitter);
exports.Connection = Connection;

Connection.prototype.connect = function(params, onOnline) {
	this.remoteFeatures = new Array;
	this.pendingRequests = new Array;
	
	var self = this;
	
	this.client = new xmpp.Client(params);

	this.client.on('online',
		function() {
			self.updatePresence();
			onOnline();
		}
	);
	
	this.client.on('end', function() {
		this.emit('end');
	});

	this.client.on('stanza', this.onStanza);

	this.client.on('error', this.onError);
}

Connection.prototype.disconnect = function() {
	this.client.end();
}

/**
 * Adds a feature to the shared services and updates the presence accordingly.
 */
Connection.prototype.shareFeature = function(feature) {
    logger.info("Sharing service with ns:" + feature.ns);
    this.sharedFeatures[feature.ns] = feature;
	this.updatePresence();
}

/**
 * Removes a feature from the shared services and updates the presence accordingly.
 */
Connection.prototype.unshareFeature = function(feature) {
    logger.info("Unsharing service with ns: " + feature.ns);
    delete this.sharedFeatures[feature.ns];
    this.updatePresence();
}

Connection.prototype.updatePresence = function() {
	var allFeatures = this.basicFeatures.slice(0); // copies the basic features
	
	for (var key in this.sharedFeatures) { // add the shared features
		allFeatures.push(key);
	}

	allFeatures = allFeatures.sort();

	var s = "client/device//Webinos 0.1.0<";

	for (var feature in allFeatures) {
		s = s + feature + "<";
	}
	
	var ver = hashlib.sha1(s);
	
	this.featureMap[ver] = allFeatures;
	
    this.sendPresence(ver);
}

/**
 * Called to invoke a remote feature. Params is optional.
 */
Connection.prototype.invokeFeature = function(feature, callback, params) {
	var id = this.getUniqueId('feature');
	this.pendingRequests[id] = callback;
	
	//TODO do something with optional params.
	
	this.client.send(
		new xmpp.Element('iq', { 'to': feature.device, 'type': 'get', 'id': id }).
			c('query', {'xmlns': feature.ns})
	);

	logger.debug('Feature ' + feature.ns + ' invoked for ' + feature.device);
}

// Send presence notification according to http://xmpp.org/extensions/xep-0115.html
Connection.prototype.sendPresence = function(ver) {
    logger.debug("XEP-0115 caps: " + this.featureMap[ver]);

	this.client.send(new xmpp.Element('presence', { }).
		c('c', {
			'xmlns': 'http://jabber.org/protocol/caps',
		  	'hash': 'sha-1',
		  	'node': nodeType,
		  	'ver': ver
		}));
}

Connection.prototype.onStanza = function(stanza) {
	logger.trace('Stanza received = ' + stanza);
	
	if (stanza.is('presence') && stanza.attrs.type !== 'error') {
		if (stanza.attrs.type == 'unavailable') {
			// in scope of client so call back to connection
			connection.onPresenceBye(stanza);
		} else if (stanza.getChild('c', 'http://jabber.org/protocol/caps') != null) {
			connection.onPresenceCaps(stanza);
		} else if (stanza.attrs.type == 'result' && stanza.getChild('query', 'http://jabber.org/protocol/disco#info') != null) {
			connection.onPresenceDisco(stanza);
		}
	}
	
	if (stanza.is('iq') && stanza.attrs.type !== 'error') {
		if (stanza.attrs.type == 'get' && stanza.getChild('query', 'http://jabber.org/protocol/disco#info') != null) {
			connection.onDiscoInfo(stanza);
		} else if (stanza.attrs.type == 'result' && stanza.getChild('query', 'http://jabber.org/protocol/disco#info') != null) {
			connection.onPresenceDisco(stanza);
		} else if (stanza.attrs.type === 'result' || stanza.attrs.type === 'error') {
			// handle results of queries.
			
			var callback = connection.pendingRequests[stanza.attrs.id];
			
			if (callback == null) {
				logger.warn("Received a result for an unknown request id: " + stanza.attrs.id);
			} else {
				// dispatch the result to the 
				var query = stanza.getChild('query');
				delete connection.pendingRequests[stanza.attrs.id];
				callback(stanza.attrs.type, query);
			}
		} else if (stanza.attrs.type == 'get' || stanza.attrs.type == 'set') {
			var query = stanza.getChild('query');
			var found = false;
			
			if (query != null && query.attrs.xmlns != null) {
				var feature = connection.sharedFeatures[query.attrs.xmlns]; //TODO there is a limit to only 1 feature per namespace.

				if (feature != null) {
					logger.debug("Feature " + feature.ns + " is being invoked by " + stanza.attrs.from);
					feature.invoked(stanza);
				} else {
					// default respond with an error
					this.send(new xmpp.Element('iq', { 'id': stanza.attrs.id, 'type': 'result', 'to': stanza.attrs.from }).c('service-unavailable'));
				}
			} else {
				// default respond with an error
				this.send(new xmpp.Element('iq', { 'id': stanza.attrs.id, 'type': 'result', 'to': stanza.attrs.from }).c('service-unavailable'));
			}
		}
	}
}

/**
 * Answers the info query.
 */
Connection.prototype.answer = function(stanza, result) {
	var query = stanza.getChild('query');
	
	this.client.send(
		new xmpp.Element('iq', { 'id': stanza.attrs.id, 'type': 'result', 'to': stanza.attrs.from }).
			c('query', { xmlns: query.attrs.xmlns }).t(result)
	);
}

Connection.prototype.onPresenceBye = function(stanza) {
	var from = stanza.attrs.from;
	var features = this.remoteFeatures[from];
	
	for (var i=0; i<features.length; i++) {
		logger.trace('Feature = ' + features[i].ns);
		feature.remove();
	}
	
	delete this.remoteFeatures[from];
	
	logger.info(from + ' has left the building.');
}

Connection.prototype.onDiscoInfo = function(stanza) {
	var currentFeatures;
	var query = stanza.getChild('query', 'http://jabber.org/protocol/disco#info');

	if (stanza.attrs.from == null) {
		return;
	}

	if (query.attrs.node != null) {
		var node = query.attrs.node;
		var ver = node.substring(nodeType.length + 1);
		logger.debug("Received feature request for version: " + ver);
		logger.debug("Returning the features for this version: " + this.featureMap[ver]);
		currentFeatures = this.featureMap[ver];
	} else {
		// return current features
		currentFeatures = this.basicFeatures.slice(0);
		
		for (var key in this.sharedFeatures) { // add the shared features
			currentFeatures.push(key);
		}

		currentFeatures = currentFeatures.sort();
	}

	var resultQuery = new ltx.Element('query', {xmlns: query.attrs.xmlns});
	
	resultQuery.c('identity', {'category': 'client', 'type': 'webinos'});
	
	for (var i in currentFeatures) {
		resultQuery.c('feature', {'var': currentFeatures[i]});
	}
	
	var result = new xmpp.Element('iq', { 'to': stanza.attrs.from, 'type': 'result', 'id': stanza.attrs.id });
	result.cnode(resultQuery);
	
	this.client.send(result);
}

Connection.prototype.onPresenceCaps = function (stanza) {
	var c = stanza.getChild('c', 'http://jabber.org/protocol/caps');
	
	logger.debug("Capabilities received, for now we always query for the result.");
	
	this.client.send(new xmpp.Element('iq', { 'to': stanza.attrs.from, 'type': 'get', 'id': this.getUniqueId('disco')}).
		c('query', { 'xmlns': 'http://jabber.org/protocol/disco#info', 'node': c.attrs.node + '#' + c.attrs.ver})
	);
	
	//TODO save transaction number and lookup the correct transaction for this result.
}

Connection.prototype.onPresenceDisco = function (stanza) {
	logger.debug('Entering onPresenceDisco');
	var query = stanza.getChild('query', 'http://jabber.org/protocol/disco#info');
    var from = stanza.attrs.from;

	var featureNodes = query.getChildren('feature');
	var discoveredFeatures = new Array;
	
	for (var i in featureNodes) {
		var ns = featureNodes[i].attrs.var;

		//TODO if this is not one of the interal features then inform listeners about the new feature.
		
		this.createAndAddRemoteFeature(ns, from);
		
		discoveredFeatures.push(ns);
	} 

    logger.debug(from + ' now shares services: ' + discoveredFeatures.join(" & ") );

	//TODO do something with discovered service. Probably call listeners that have previously been installed
/*
    // Traverse all possible services
    var inCurrent = [];
    jQuery.each(webinos.NS, function(i,v) {
        var name = v.split('/').pop();                      // determine service name
        var inFeatures = jQuery.inArray(v, features) != -1; // is it in the announced features?
        var inCurrent = false;                              // is it in the current list?
        var duploService = null;
        var duploIndex = -1;
        var currentServices = webinosImpl.remoteServices[from];
        if (currentServices) {
            jQuery.each(currentServices, function(i2,v2) {
                if (v2.name == name) {
                    duploService = v2;
                    duploIndex = i2;
                    inCurrent = true;
                }
            });
        }
        if (inCurrent && !inFeatures) {                     // remove service
            log('Removing service of type ' + duploService.name + ' from ' + from);
            webinosImpl.remoteServices[from].splice(duploIndex, 1);
            duploService.remove();                          // fires the callback (if applicable)
        } else
        if (!inCurrent && inFeatures) {                     // create and add service
            webinosImpl.createService(name, from);
        }
    });
    return true; // handler must remain active
*/
}

Connection.prototype.onError = function(error) {
	logger.warn(error);
}

// Helper function that creates a service, adds it to the administration and invokes the callback
Connection.prototype.createAndAddRemoteFeature = function(name, from) {
	var factory = WebinosFeatures.factory[name];

	if (factory != null) {
		feature = factory();
	    feature.device = from;
	    feature.owner = this.getBareJidFromJid(from);
	    feature.id = this.jid2Id(from) + '-' + name;

	    var currentFeatures = this.remoteFeatures[from];
	    if (!currentFeatures) currentFeatures = [];

	    currentFeatures.push(feature);

	    this.remoteFeatures[from] = currentFeatures;

	    logger.debug('Created and added new service of type ' + name);

		this.emit(feature.ns, feature);
		feature.on('invoke', this.invokeFeature);
	}
}

// Helper function to return a 'clean' id string based on a jid
Connection.prototype.jid2Id = function (jid) {
    return jid.split(/@|\/|\./).join("_");
}

/** Function: getBareJidFromJid
 *  Get the bare JID from a JID String.
 *
 *  Parameters:
 *    (String) jid - A JID.
 *
 *  Returns:
 *    A String containing the bare JID.
 */
Connection.prototype.getBareJidFromJid = function (jid)
{
    return jid.split("/")[0];
}

/** Function: getUniqueId
 *  Generate a unique ID for use in <iq/> elements.
 *
 *  All <iq/> stanzas are required to have unique id attributes.  This
 *  function makes creating these easy.  Each connection instance has
 *  a counter which starts from zero, and the value of this counter
 *  plus a colon followed by the suffix becomes the unique id. If no
 *  suffix is supplied, the counter is used as the unique id.
 *
 *  Suffixes are used to make debugging easier when reading the stream
 *  data, and their use is recommended.  The counter resets to 0 for
 *  every new connection for the same reason.  For connections to the
 *  same server that authenticate the same way, all the ids should be
 *  the same, which makes it easy to see changes.  This is useful for
 *  automated testing as well.
 *
 *  Parameters:
 *    (String) suffix - A optional suffix to append to the id.
 *
 *  Returns:
 *    A unique string to be used for the id attribute.
 */
Connection.prototype.getUniqueId = function (suffix) {
    if (typeof(suffix) == "string" || typeof(suffix) == "number") {
        return ++this._uniqueId + ":" + suffix;
    } else {
        return ++this._uniqueId + "";
    }
}
