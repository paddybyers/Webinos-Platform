(function () {
	"use strict";

	var policyManager;
	
	policyManager = function() {
		// Load the native module
		this.pmNativeLib = require('./build/default/pm.node');
		this.pmCore = new this.pmNativeLib.PolicyManagerInt();
		
	}

	policyManager.prototype.enforceRequest = function(request) {
		var res = this.pmCore.enforceRequest(request);
		if (res==2 || res==3 || res==4) {
			// TODO: Handle policy prompting here
			console.log("...Prompting to be implemented...");
		}
		return (res);
	}

	exports.policyManager = policyManager;

}());
