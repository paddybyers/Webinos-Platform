(function () {
	"use strict";

	if (typeof webinos === "undefined") {
		webinos = {};
	}

	if (!webinos.devicestatus) {
		webinos.devicestatus = {};
	}

	var DeviceapisDeviceStatusManager, DeviceStatusManager, PropertyValueSuccessCallback, ErrorCallback, DeviceAPIError, PropertyRef;

	DeviceapisDeviceStatusManager = function () {
		this.devicestatus = new DeviceStatusManager();
	};

	DeviceapisDeviceStatusManager.prototype.devicestatus = null;

	DeviceStatusManager = function () {};

	DeviceStatusManager.prototype.getPropertyValue = function (prop, successCallback, errorCallback) {
		var rpc = webinos.rpc.createRPC("DeviceStatusManager", "getPropertyValue", arguments);
		webinos.rpc.executeRPC(rpc, 
			function (params) { successCallback(params); },
			function (error) {});
		return;
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

	PropertyRef = function () {
		this.component = String;
		this.aspect = String;
		this.property = String;
	};

	PropertyRef.prototype.component = String;
	PropertyRef.prototype.aspect = String;
	PropertyRef.prototype.property = String;

	webinos.devicestatus = new DeviceStatusManager();
}());
