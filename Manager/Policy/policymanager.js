(function () {
	"use strict";

	var policyManager,
	exec = require('child_process').exec;
	var os = require('os');

	policyManager = function() {
		// Load the native module
		if (os.platform()=='android') {
			this.pmNativeLib = require('pm');
		}
		else {
			this.pmNativeLib = (process.versions.node < "0.6.0" ) ? require('./build/default/pm.node') : require('./build/Release/pm.node');
		}
		this.pmCore = new this.pmNativeLib.PolicyManagerInt();
	}

	policyManager.prototype.enforceRequest = function(request, errorCallback, successCallback /*, successCallbackParams*/ ) {
		var res = this.pmCore.enforceRequest(request);
		if (arguments.length > 1) {

			var successCallbackParams = Array.prototype.slice.call(arguments).splice(3);

			switch(res) {
				case 0:		successCallback.apply(this, successCallbackParams);
						break;

				case 1:		errorCallback("SECURITY_ERR: " + res);
						break;

				case 2:
				case 3:
				case 4:		var child = exec("xmessage -buttons allow,deny -print 'Access request to " + request.resourceInfo.apiFeature  + "'",
							function (error, stdout, stderr) {	
								if (stdout == "allow\n") {
									successCallback.apply(this, successCallbackParams);
								}
								else {
									errorCallback("SECURITY_ERR: " + res);
								}
							});
						break;

				default:	errorCallback("SECURITY_ERR: " + res);
			}
		}
		return (res);
	}

	policyManager.prototype.reloadPolicy = function() {
		this.pmCore.reloadPolicy();
		return;
	}

	exports.policyManager = policyManager;

}());
