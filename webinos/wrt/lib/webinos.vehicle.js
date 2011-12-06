	///////////////////// VEHICLE INTERFACE ///////////////////////////////
	var Vehicle;
	
	var _referenceMapping = new Array();
	var _vehicleDataIds = new Array('climate-all', 'climate-driver', 'climate-passenger-front', 'climate-passenger-rear-left','passenger-rear-right','lights-fog-front','lights-fog-rear','lights-signal-right','lights-signal-warn','lights-parking-hibeam','lights-head','lights-head','wiper-front-wash','wiper-rear-wash','wiper-automatic','wiper-front-once','wiper-rear-once','wiper-front-level1','wiper-front-level2','destination-reached','destination-changed','destination-cancelled','parksensors-front','parksensors-rear','shift','tripcomputer'); 
	
	
	Vehicle = function(obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	Vehicle.prototype = new WebinosService;
	
	Vehicle.prototype.get = function(vehicleDataId, callOnSuccess, callOnError) {	
		arguments[0] = vehicleDataId;
		var rpc = webinos.rpc.createRPC(this, "get", arguments);
		
		webinos.rpc.executeRPC(rpc,
			function(result){
					callOnSuccess(result);
			},
			function(error){
					callOnError(error);
			}
		);
	};
	
	Vehicle.prototype.addEventListener = function(vehicleDataId, eventHandler, capture) {
		if(_vehicleDataIds.indexOf(vehicleDataId) != -1){	
			var rpc = webinos.rpc.createRPC(this, "addEventListener", vehicleDataId);
			
            
            rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	
			
			_referenceMapping.push([rpc.fromObjectRef, eventHandler]);
			console.log('# of references' + _referenceMapping.length);
			
			var callback = new RPCWebinosService({api:rpc.fromObjectRef});
			callback.onEvent = function (vehicleEvent) {
				eventHandler(vehicleEvent);
			};
			webinos.rpc.registerCallbackObject(callback);
			
			webinos.rpc.executeRPC(rpc);
		}else{
			console.log(vehicleDataId + ' not found');	
		}
	
	};
		
	Vehicle.prototype.removeEventListener = function(vehicleDataId, eventHandler, capture){
		var refToBeDeleted = null;
		for(var i = 0; i < _referenceMapping.length; i++){
			console.log("Reference" + i + ": " + _referenceMapping[i][0]);
			console.log("Handler" + i + ": " + _referenceMapping[i][1]);
			if(_referenceMapping[i][1] == eventHandler){
					var arguments = new Array();
					arguments[0] = _referenceMapping[i][0];
					arguments[1] = vehicleDataId;
					
					
					console.log("ListenerObject to be removed ref#" + refToBeDeleted);					
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
	
	Vehicle.prototype.POI = function(name, position, address){
		this.name = name;
		this.position = position;
		this.address = address;
	}
	
	Vehicle.prototype.Address = function(country, region, county, city, street, streetNumber, premises, additionalInformation, postalCode){
		this.county = county;
		this.regions = region;
		this.county = city;
		this.street = streetNumber;
		this.premises = premises;
		this.addtionalInformation = additionalInformation;
		this.postalCode = postalCode;
	}
	
	Vehicle.prototype.LatLng = function(lat, lng){
		this.latitude = lat;
		this.longitude = lng;
	}
	
	
	Vehicle.prototype.requestGuidance = function(callOnSuccess, callOnError, destinations){
		arguments = destinations;
		var successCb = callOnSuccess;
		var errorCb = callOnError;
		var rpc = webinos.rpc.createRPC(this, "requestGuidance", arguments);
		webinos.rpc.executeRPC(rpc,
			function(){
				callOnSuccess();
			},
			function(error){
				callOnError(error);
			}
		);
	};
	
	Vehicle.prototype.findDestination = function(callOnSuccess, callOnError, search){
		arguments = search;
		
		var rpc = webinos.rpc.createRPC(this, "findDestination", arguments);
				webinos.rpc.executeRPC(rpc,
			function(results){
				callOnSuccess(results);
			},
			function(error){
				callOnError(error);
			}
		);		
	};
