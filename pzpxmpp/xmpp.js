var ltx = require('ltx');
var sys = require('sys');
var xmpp = require('node-xmpp');
var hashlib = require("./libs/hashlib");
var serviceFactory = require("./service.js");
var nodeType = 'http://webinos.org/pzp';
var connection;

function Connection() {
	connection = this;

	this._uniqueId = Math.round(Math.random() * 10000);

	this.features = ["http://jabber.org/protocol/caps", 
				 	 "http://jabber.org/protocol/disco#info",
                   	 "http://jabber.org/protocol/commands"];
    
	this.callbacks = {};         // administration of callbacks for all service types
    this.sharedServices = {};    // services that the app wants shared
    this.remoteServices = {};    // services that are shared with us, assoc array of arrays
    this.pendingRequests = {};   // hash to store <stanza id, geo service> so results can be handled
    this.featureMap = {};      // holds features, see initPresence() for explanation
}

exports.Connection = Connection;

Connection.prototype.connect = function(params, onOnline) {
	this.remoteServices = new Array;
	this.pendingRequests = new Array;
	
	var self = this;
	
	this.client = new xmpp.Client(params);

	this.client.on('online',
		function() {
			self.updatePresence();
			onOnline();
		}
	);

	this.client.on('stanza', this.onStanza);

	this.client.on('error', this.onError);
}

Connection.prototype.disconnect = function() {
	this.client.end();
}

Connection.prototype.onEnd = function(onEnd) {
	this.client.on('end', onEnd);
}

Connection.prototype.findServices = function(p, cb) {
    var api = p['api'];

    if (!api) {
        console.error('Error installing callback: api missing');
        return;
    }

    if (cb) {
        this.callbacks[api] = cb;
        console.log('findService callback installed for ' + api);
    } else {
        delete this.callbacks[api];
        console.log('findService callback removed for ' + api);
    }
}

Connection.prototype.shareService = function(ns, flag) {
    console.log( (flag?"Starting":"Stopping") + " sharing service with ns:" + ns);
    if (flag) {
        this.sharedServices[ns] = flag;
    } else {
        delete this.sharedServices[ns];
    }
    this.updatePresence();
}

Connection.prototype.geoLocationInvoke = function(geoRequest) {
	var id = this.getUniqueId('geo');
	this.pendingRequests[id] = geoRequest;
	this.client.send(
		new xmpp.Element('iq', { 'to': geoRequest.device, 'type': 'get', 'id': id }).
			c('query', {'xmlns': geoRequest.namespace})
	);

	console.log('Geolocation service invoked for ' + geoRequest.device);
}

/**
 * This function add the feature to the feature map, calculates the hashes of the current
 * capabilities and sends out a presence update.
 */
Connection.prototype.addFeature = function(feature) {
	this.features.push(feature);
	this.updatePresence();
}

Connection.prototype.updatePresence = function() {
	this.features = this.features.sort();

	var s = "client/device//Webinos 0.1.0<";

	for (var feature in this.features) {
		s = s + feature + "<";
	}
	
	var ver = hashlib.sha1(s);
	
	this.featureMap[ver] = this.features.clone();
	
    this.sendPresence(ver);
}

/**
 * This function removes the feature to the feature map, calculates the hashes of the current
 * capabilities and sends out a presence update.
 */
Connection.prototype.removeFeature = function(feature) {
	var index = this.features.indexOf(feature);
	
	if (index != -1) {
		this.features.splice(index, 1);
	}

    this.updatePresence();
}

// Send presence notification according to http://xmpp.org/extensions/xep-0115.html
Connection.prototype.sendPresence = function(ver) {
    console.log("XEP-0115 caps: " + this.featureMap[ver]);

	this.client.send(new xmpp.Element('presence', { }).
		c('c', {
			'xmlns': 'http://jabber.org/protocol/caps',
		  	'hash': 'sha-1',
		  	'node': nodeType,
		  	'ver': ver
		}));
}

Connection.prototype.onStanza = function(stanza) {
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
		}
	}
}

Connection.prototype.onPresenceBye = function(stanza) {
	var from = stanza.attrs.from;
	var services = this.remoteServices[from];
	
	for (service in services) {
		service.remove();
	} 
	
	delete this.remoteServices[from];
	
	console.log(from + ' has left the building.');
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
		console.log("Requested features for version: " + ver);
		console.log("Returning the features for this version: " + this.featureMap[ver]);
		currentFeatures = this.featureMap[ver];
	} else {
		// return current features
		currentFeatures = this.features.clone();
	}

	var resultQuery = new ltx.Element('query', {'xmlns': query.attrs.xmlsns});
	resultQuery.c('identity', {'category': 'client', 'type': 'webinos'});
	
	for (var i in currentFeatures) {
		if (typeof currentFeatures[i] == 'function') break;
		resultQuery.c('feature', {'var': currentFeatures[i]});
	}
	
	var result = new xmpp.Element('iq', { 'to': stanza.attrs.from, 'type': 'result', 'id': stanza.attrs.id });
	result.cnode(resultQuery);
	
	this.client.send(result);
}

Connection.prototype.onPresenceCaps = function (stanza) {
	var c = stanza.getChild('c', 'http://jabber.org/protocol/caps');
	
	console.log("Capabilities received, for now we always query for the result.");
	
	this.client.send(new xmpp.Element('iq', { 'to': stanza.attrs.from, 'type': 'get', 'id': this.getUniqueId('disco')}).
		c('query', { 'xmlns': 'http://jabber.org/protocol/disco#info', 'node': c.attrs.node + '#' + c.attrs.ver})
	);
}

Connection.prototype.onPresenceDisco = function (stanza) {
	var query = stanza.getChild('query', 'http://jabber.org/protocol/disco#info');
    var from = stanza.attrs.from;

	var featureNodes = query.getChildren('feature');
	var discoveredFeatures = new Array;
	
	for (var i in featureNodes) {
		if (typeof featureNodes[i] == 'function') break;
		var feature = featureNodes[i].attrs.var;
		discoveredFeatures.push(feature);
	} 

    console.log(from + ' now shares services: ' + discoveredFeatures.join(" & ") );

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
	console.log(error);
}

// Helper function that creates a service, adds it to the administration and invokes the callback
Connection.prototype.createService = function(name, from) {
    var s = (name == "geolocation") ? (new serviceFactory.GeolocationService) : (new serviceFactory.RemoteAlertingService);
    s.device = from;
    s.owner = this.getBareJidFromJid(from);
    s.id = this.jid2Id(from) + '-' + name;

    var currentServices = this.remoteServices[from];
    if (!currentServices) currentServices = [];

    currentServices.push(s);
    this.remoteServices[from] = currentServices;

    console.log('Created and added new service of type ' + name);
    
	var callback = this.callbacks[s.ns];
    if (callback) (callback)(s);
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

Array.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
}