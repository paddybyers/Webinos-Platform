(function () {
	"use strict";

	var DeviceapisDeviceStatusManager, DeviceStatusManager, PropertyValueSuccessCallback, ErrorCallback, DeviceAPIError, PropertyRef,
	nativeDeviceStatus = require("../cc/build/default/nativedevicestatus"),
	pmlib = require("../../../../../Manager/Policy/policymanager.js"),
	policyManager,
	exec = require('child_process').exec; // this line should be moved in the policy manager

//Regular policyManger lib loading.. the library currently is loaded inside the getPropertyValue method
//to recognize real-time changes in the policy, (we need a method to sync the policy) 
/*	try {
		policyManager = new pmlib.policyManager();
	}
	catch(e) {
		console.log("Load error: "+e.message);
		return;
	}
*/
	DeviceapisDeviceStatusManager = function () {
		this.devicestatus = new DeviceStatusManager();
	};

	DeviceapisDeviceStatusManager.prototype.devicestatus = null;

	DeviceStatusManager = function () {};

	DeviceStatusManager.prototype.getPropertyValue = function (successCallback, errorCallback, prop) {
		var res,
		request = {},
		subjectInfo = {},
		resourceInfo = {};

		subjectInfo.userId = "user1";
		request.subjectInfo = subjectInfo;

		resourceInfo.apiFeature = "http://wacapps.net/api/devicestatus";
		request.resourceInfo = resourceInfo;
		res = policyManager.enforceRequest(request);

		console.log("policyManager says:" + res);
		

		//This part should be moved to the policy manager module 
		if (res == 0) { //PERMIT
			successCallback(nativeDeviceStatus.getPropertyValue(prop));
		}
		else if (res == 1) { //DENY
			errorCallback("SECURITY_ERR:"+ res);
		}
		else //PROMPT
		{
			var child = exec("xmessage -buttons allow,deny -print 'Access request to " + prop.property + " info'", function (error, stdout, stderr) {
					
				if (stdout == "allow\n") {
					successCallback(nativeDeviceStatus.getPropertyValue(prop));
				}
				else{
					errorCallback("SECURITY_ERR:"+ res);
				}
			});
		}
	};

	PropertyValueSuccessCallback = function () {};

	PropertyValueSuccessCallback.prototype.onSuccess = function (prop) {
		return;
	};

	ErrorCallback = function () {};
	
	ErrorCallback.prototype.onError = function (error) {
		return;
	};

	DeviceAPIError = function () {
		this.message = String;
		this.code = Number;
	};

	DeviceAPIError.prototype.UNKNOWN_ERR                    = 0;
	DeviceAPIError.prototype.INDEX_SIZE_ERR                 = 1;
	DeviceAPIError.prototype.DOMSTRING_SIZE_ERR             = 2;
	DeviceAPIError.prototype.HIERARCHY_REQUEST_ERR          = 3;
	DeviceAPIError.prototype.WRONG_DOCUMENT_ERR             = 4;
	DeviceAPIError.prototype.INVALID_CHARACTER_ERR          = 5;
	DeviceAPIError.prototype.NO_DATA_ALLOWED_ERR            = 6;
	DeviceAPIError.prototype.NO_MODIFICATION_ALLOWED_ERR    = 7;
	DeviceAPIError.prototype.NOT_FOUND_ERR                  = 8;
	DeviceAPIError.prototype.NOT_SUPPORTED_ERR              = 9;
	DeviceAPIError.prototype.INUSE_ATTRIBUTE_ERR            = 10;
	DeviceAPIError.prototype.INVALID_STATE_ERR              = 11;
	DeviceAPIError.prototype.SYNTAX_ERR                     = 12;
	DeviceAPIError.prototype.INVALID_MODIFICATION_ERR       = 13;
	DeviceAPIError.prototype.NAMESPACE_ERR                  = 14;
	DeviceAPIError.prototype.INVALID_ACCESS_ERR             = 15;
	DeviceAPIError.prototype.VALIDATION_ERR                 = 16;
	DeviceAPIError.prototype.TYPE_MISMATCH_ERR              = 17;
	DeviceAPIError.prototype.SECURITY_ERR                   = 18;
	DeviceAPIError.prototype.NETWORK_ERR                    = 19;
	DeviceAPIError.prototype.ABORT_ERR                      = 20;
	DeviceAPIError.prototype.TIMEOUT_ERR                    = 21;
	DeviceAPIError.prototype.INVALID_VALUES_ERR             = 22;
	DeviceAPIError.prototype.NOT_AVAILABLE_ERR              = 101;
	DeviceAPIError.prototype.code = Number;
	DeviceAPIError.prototype.message = Number;

	PropertyRef = function (component, aspect, property) {
		if (typeof component === 'string') {
			this.component = component;
		}
		
		if (typeof aspect === 'string') {
			this.aspect = aspect;
		}
		
		if (typeof property === 'string') {
			this.property = property;
		}
	};

	PropertyRef.prototype.component = String;
	PropertyRef.prototype.aspect = String;
	PropertyRef.prototype.property = String;

	exports.devicestatus = new DeviceapisDeviceStatusManager();
}());
