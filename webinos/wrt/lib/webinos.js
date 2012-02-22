(function() {
    if (typeof webinos === "undefined") webinos = {};
    var channel = null;

    /**
     * Creates the socket communication channel
     * for a locally hosted websocket server at port 8080
     * for now this channel is used for sending RPC, later the webinos
     * messaging/eventing system will be used
     */
    function createCommChannel(successCB) {
        try {
            channel = new WebinosSocket();
        } catch(e1) {
	        try {
	            var port = parseInt(location.port) + 1;
	            if (isNaN(port)) {
	                port = 81;
	            }
	            channel  = new WebSocket('ws://'+window.location.hostname+':'+port);                
	        } catch(e2) {
	            channel  = new MozWebSocket('ws://'+window.location.hostname+':'+port);
	        }
        }
        webinos.session.setChannel(channel);

        channel.onmessage = function(ev) {
            console.log('WebSocket Client: Message Received : ' + JSON.stringify(ev.data));
            var data = JSON.parse(ev.data);
            if(data.type === "prop") {
                webinos.session.handleMsg(data);
            } else {
                webinos.messageHandler.setGetOwnId(webinos.session.getSessionId());
                webinos.messageHandler.setObjectRef(this);
                webinos.messageHandler.setSendMessage(webinos.session.message_send_messaging);
                webinos.messageHandler.onMessageReceived(data, data.to);
            }
        };
    }
    createCommChannel ();

    if (typeof webinos === 'undefined') webinos = {};

    webinos.rpcHandler = new RPCHandler();
    webinos.messageHandler = new MessageHandler(webinos.rpcHandler);


    ///////////////////// WEBINOS INTERNAL COMMUNICATION INTERFACE ///////////////////////////////


    function logObj(obj, name){
        for (var myKey in obj){
            console.log(name + "["+myKey +"] = "+obj[myKey]);
            if (typeof obj[myKey] == 'object') logObj(obj[myKey], name + "." + myKey);
        }
    }

    ///////////////////// WEBINOS DISCOVERY INTERFACE ///////////////////////////////

    webinos.ServiceDiscovery = {};
    webinos.ServiceDiscovery.registeredServices = 0;

    webinos.ServiceDiscovery.findServices = function (serviceType, callback) {
        // pure local services..
        if (serviceType == "BlobBuilder"){
            var tmp = new BlobBuilder();
            webinos.ServiceDiscovery.registeredServices++;
            callback.onFound(tmp);
            return;
        }

        function success(params) {
            var baseServiceObj = params;

            console.log("servicedisco: service found.");
            $('#message').append('<li> Found Service: '+baseServiceObj.api+'</li>');                                

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

            console.log(typeMap);
            console.log(baseServiceObj);


            var serviceConstructor = typeMap[baseServiceObj.api];
            if (typeof serviceConstructor !== 'undefined') {


            	//TODO this is a bad hack to ensure that only one (the connected pzp one) Event API is found => EVENT API should
            	//be statically accessible ==> internally should be done using findService with filter for own PZP and for PZH
                //if (baseServiceObj.api === 'http://webinos.org/api/events' && baseServiceObj.serviceAddress !== webinos.session.getPZPId()){
                //	return;
                //}
            	
            	// elevate baseServiceObj to usable local WebinosService object
                var service = new serviceConstructor(baseServiceObj);
                webinos.ServiceDiscovery.registeredServices++;
                callback.onFound(service);
            } else {
                var serviceErrorMsg = 'Cannot instantiate service in the browser.';
                console.log(serviceErrorMsg);
                if (typeof callback.onError === 'function') {
                    callback.onError(new DiscoveryError(102, serviceErrorMsg));
                }
            }
        }

        var id = Math.floor(Math.random()*1001);
        var rpc = webinos.rpcHandler.createRPC("ServiceDiscovery", "findServices", [serviceType, webinos.session.getSessionId(), id]);
        rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID

        var callback2 = new RPCWebinosService({api:rpc.fromObjectRef});
        callback2.onservicefound = function (params, successCallback, errorCallback, objectRef) {
            // params
            success(params);
        };
        webinos.rpcHandler.registerCallbackObject(callback2);

        rpc.serviceAddress = webinos.session.getServiceLocation();              
        webinos.rpcHandler.executeRPC(rpc);

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
