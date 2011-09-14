var sys = require('sys');
var EventEmitter = require('events').EventEmitter;

/*
 * 'Class' definition of generic webinos feature
 *
 * inspiration for subclassing methodology comes from http://www.webreference.com/js/column79/4.html
 */
function GenericFeature() {
	EventEmitter.call(this);
	
    this.id = null;                                             // (app level) unique id, e.g. for use in html user interface
    this.owner = null;                                          // person that owns the device the service is running on
    this.device = null;                                         // (addressable) id of device the service is running on
    this.name = "(you shouldn't see this!)";                    // friendly name, to be overridden
    this.ns = null;                                             // name space that (globally) uniquely defines the service type

    this.remove = function() {                                  // call this when this feature is removed.
		this.emit('remove', this);
	}
	
    this.isLocal = function() {                                 // returns true is the feature is running on the local device
	    return (this.device == webinos.device);
	}
	
    this.isMine = function() {                                  // returns true if the feature runs on a device of same owner
	    return (this.owner == webinos.owner);
	}

    /* called when a local shared service is invoked remotely */
	this.invoked = function(params) {
		this.emit('invoked', this, params);
	}

	/* called to invoke a remote shared service */
    this.invoke = function(params) { 
		this.emit('invoke', this, params);
	};  

    /* called when the result of a remote service invocation is received */
    this.result = function(params) {
		this.emit('result', this, params);
    };

	/* called when a remote service invocation resulted in an error */
    this.error = function(err) {
        this.emit('error', this, err);
    };
}

sys.inherits(GenericFeature, EventEmitter);
exports.GenericFeature = GenericFeature;
