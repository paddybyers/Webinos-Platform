var sys = require('sys');
var GenericFeature = require('./GenericFeature.js');

/*
 * Remote-alert Feature, defines as subclass of GenericFeature
 */
function RemoteAlertFeature() {
	GenericFeature.GenericFeature.call(this);

    this.ns = "http://webinos.org/api/remote-alert";
    this.name = "remote-alert";
}

sys.inherits(RemoteAlertFeature, GenericFeature.GenericFeature);
exports.RemoteAlertFeature = RemoteAlertFeature;

///////////////////////// END Remote Alering Service /////////////////////////

