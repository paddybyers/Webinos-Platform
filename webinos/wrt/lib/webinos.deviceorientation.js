(function() {

WebinosDeviceOrientation = function (obj) {
	this.base = WebinosService;
	this.base(obj);
};

var _referenceMappingDo = new Array();
var _eventIdsDo = new Array('deviceorientation', 'compassneedscalibration', 'devicemotion');

WebinosDeviceOrientation.prototype = new WebinosService;

WebinosDeviceOrientation.prototype.bindService = function (bindCB, serviceId) {
	// actually there should be an auth check here or whatever, but we just always bind
	this.addEventListener = addEventListener;
	this.removeEventListener = removeEventListener;
	this.dispatchEvent = dispatchEvent;
	
	if (typeof bindCB.onBind === 'function') {
		bindCB.onBind(this);
	};
}

function addEventListener(type, listener, useCapture) {
    
    if(_eventIdsDo.indexOf(type) != -1){	
    
            console.log("LISTENER"+ listener);
    
			var rpc = webinos.rpc.createRPC(this, "addEventListener", [type, listener, useCapture]);
            rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	
			_referenceMappingDo.push([rpc.fromObjectRef, listener]);

			console.log('# of references' + _referenceMappingDo.length);	
			var callback = new RPCWebinosService({api:rpc.fromObjectRef});
			callback.onEvent = function (orientationEvent) {
				listener(orientationEvent);
			};
            
			webinos.rpc.registerCallbackObject(callback);
			webinos.rpc.executeRPC(rpc);
		}else{
			console.log(type + ' not found');	
		}
};


function removeEventListener(type, listener, useCapture) {
        console.log("LISTENER"+ listener);


        var refToBeDeleted = null;
		for(var i = 0; i < _referenceMappingDo.length; i++){
			console.log("Reference" + i + ": " + _referenceMappingDo[i][0]);
			console.log("Handler" + i + ": " + _referenceMappingDo[i][1]);
			if(_referenceMappingDo[i][1] == listener){
					var arguments = new Array();
					arguments[0] = _referenceMappingDo[i][0];
					arguments[1] = type;
					console.log("ListenerObject to be removed ref#" + _referenceMappingDo[i][0]);                                             
                    var rpc = webinos.rpc.createRPC(this, "removeEventListener", arguments);
					webinos.rpc.executeRPC(rpc,
						function(result){
							callOnSuccess(result);
						},
						function(error){
							callOnError(error);
						}
					);
					break;			
			}	
    }
};

function dispatchEvent(event) {
    //TODO
};

})();