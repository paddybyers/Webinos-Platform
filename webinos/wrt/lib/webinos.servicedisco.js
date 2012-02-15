(function() {
	
    var ServiceDiscovery = function(rpcHandler) {
    	this.rpcHandler = rpcHandler;
    	this.registeredServices = 0;
    };
    
	/**
	 * Export definitions for node.js
	 */
	if (typeof module !== 'undefined') {
		exports.ServiceDiscovery = ServiceDiscovery;
	} else {
		// this adds ServiceDiscovery to the window object in the browser
		this.ServiceDiscovery = ServiceDiscovery;
	}
    
    ServiceDiscovery.prototype.findServices = function (serviceType, callback) {
    	var that = this;
    	
        // pure local services..
        if (serviceType == "BlobBuilder"){
            var tmp = new BlobBuilder();
            this.registeredServices++;
            callback.onFound(tmp);
            return;
        }
        
        function success(params) {
            var baseServiceObj = params;

            console.log("servicedisco: service found.");

            var typeMap = {};
            if (typeof webinos.file !== 'undefined' && typeof webinos.file.LocalFileSystem !== 'undefined')
                typeMap['http://webinos.org/api/file'] = webinos.file.LocalFileSystem;
            if (typeof TestModule !== 'undefined') typeMap['http://webinos.org/api/test'] = TestModule;
            if (typeof WebinosGeolocation !== 'undefined') typeMap['http://www.w3.org/ns/api-perms/geolocation'] = WebinosGeolocation;
            if (typeof WebinosDeviceOrientation !== 'undefined') typeMap['http://webinos.org/api/deviceorientation'] = WebinosDeviceOrientation;
            if (typeof Vehicle !== 'undefined') typeMap['http://webinos.org/api/vehicle'] = Vehicle;
            if (typeof EventsModule !== 'undefined') typeMap['http://webinos.org/api/events'] = EventsModule;
            if (typeof AppLauncherModule !== 'undefined') typeMap['http://webinos.org/api/applauncher'] = AppLauncherModule;
            if (typeof Sensor !== 'undefined') {
                typeMap['http://webinos.org/api/sensors'] = Sensor;
                typeMap['http://webinos.org/api/sensors.temperature'] = Sensor;
            }                       
            if (typeof PaymentManager !== 'undefined') typeMap['http://webinos.org/api/payment'] = PaymentManager;
            if (typeof UserProfileIntModule !== 'undefined') typeMap['UserProfileInt'] = UserProfileIntModule;
            if (typeof TVManager !== 'undefined') typeMap['http://webinos.org/api/tv'] = TVManager;
            if (typeof DeviceStatusManager !== 'undefined') typeMap['http://wacapps.net/api/devicestatus'] = DeviceStatusManager;
            if (typeof Contacts !== 'undefined') typeMap['http://www.w3.org/ns/api-perms/contacts'] = Contacts;
            if (typeof Context !== 'undefined') typeMap['http://webinos.org/api/context'] = Context;
            //if (typeof BluetoothManager !== 'undefined') typeMap['http://webinos.org/manager/discovery/bluetooth'] = BluetoothManager;
            if (typeof BluetoothManager !== 'undefined') typeMap['http://webinos.org/api/discovery'] = BluetoothManager;
            if (typeof AuthenticationModule !== 'undefined') typeMap['http://webinos.org/api/authentication'] = AuthenticationModule;
            
            if (typeof module !== 'undefined') {
            	var path = require('path');
            	var moduleRoot = path.resolve(__dirname, '../') + '/';
            	var moduleDependencies = require(moduleRoot + '/dependencies.json');
            	var webinosRoot = path.resolve(moduleRoot + moduleDependencies.root.location) + '/';
            	var dependencies = require(path.resolve(webinosRoot + '/dependencies.json'));
            	
            	var Context = require(path.join(webinosRoot, dependencies.wrt.location, 'lib/webinos.context.js')).Context;
                typeMap['http://webinos.org/api/context'] = Context;
            }

            var ServiceConstructor = typeMap[baseServiceObj.api];
            if (typeof ServiceConstructor !== 'undefined') {
            	// elevate baseServiceObj to usable local WebinosService object
                var service = new ServiceConstructor(baseServiceObj, that.rpcHandler);
                this.registeredServices++;
                callback.onFound(service);
            } else {
                var serviceErrorMsg = 'Cannot instantiate webinos service.';
                console.log(serviceErrorMsg);
                if (typeof callback.onError === 'function') {
                    callback.onError(new DiscoveryError(102, serviceErrorMsg));
                }
            }
        }
        
        var id = Math.floor(Math.random()*1001);
        var rpc = this.rpcHandler.createRPC("ServiceDiscovery", "findServices", [serviceType]);
        rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID

        var callback2 = new RPCWebinosService({api:rpc.fromObjectRef});
        callback2.onservicefound = function (params, successCallback, errorCallback, objectRef) {
            // params
            success(params);
        };
        this.rpcHandler.registerCallbackObject(callback2);

        var serviceAddress;
        if (typeof this.rpcHandler.parent !== 'undefined') {
        	serviceAddress = this.rpcHandler.parent.pzhId;
        } else {
        	serviceAddress = webinos.session.getServiceLocation();
        }
        
        rpc.serviceAddress = serviceAddress;
        this.rpcHandler.executeRPC(rpc);

        return;
    };

    var DiscoveryError = function(code, message) {
        this.code = code;
        this.message = message;
    };
    DiscoveryError.prototype.FIND_SERVICE_CANCELED = 101;
    DiscoveryError.prototype.FIND_SERVICE_TIMEOUT = 102;
    DiscoveryError.prototype.PERMISSION_DENIED_ERROR = 103;

    ///////////////////// WEBINOS SERVICE INTERFACE ///////////////////////////////

    // TODO decide what to do with this class.
    WebinosService = function (obj) {
        this.base = RPCWebinosService;
        this.base(obj);

//        this.id = Math.floor(Math.random()*101);
    };
    WebinosService.prototype = new RPCWebinosService;

    WebinosService.prototype.state = "";


//    WebinosService.prototype.api = "";


//    WebinosService.prototype.id = "";


//    WebinosService.prototype.displayName = "";


//    WebinosService.prototype.description = "";


    WebinosService.prototype.icon = "";


    // stub implementation in case a service module doesn't provide its own bindService
    WebinosService.prototype.bindService = function(bindCB) {
        if (typeof bindCB === 'undefined') return;

        if (typeof bindCB.onBind === 'function') {
            bindCB.onBind(this);
        }
    };

    WebinosService.prototype.unbind = function() {
        webinos.ServiceDiscovery.registeredServices--;
        if (channel != null && webinos.ServiceDiscovery.registeredServices > 0) {
            channel.close();
            channel = null;
        }
    };

}());
