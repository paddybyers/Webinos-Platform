(function() {

	BluetoothManager = function(obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	
	BluetoothManager.prototype = new WebinosService;
	
	BluetoothManager.prototype.findservices = function(data, success,fail){
		console.log("bluetooth findservices");
	  	var rpc = webinos.rpcHandler.createRPC(this, "findservices",arguments);
	  	webinos.rpcHandler.executeRPC(rpc, function(params) {
		success(params);
	   }, function(error) {
		  fail(error);
	   });
	  return;
	};
	
	//BluetoothManager.prototype.binddevice = function(data, success,fail){
	  //var rpc = webinos.rpcHandler.createRPC(this, "binddevice",arguments);
	  
	  BluetoothManager.prototype.bindservice = function(data, success,fail){
	  var rpc = webinos.rpcHandler.createRPC(this, "bindservice",arguments);
          webinos.rpcHandler.executeRPC(rpc, function(params) {
			success(params);
	   }, function(error) {
		  fail(error);
	   });
	  return;
	};
	
	BluetoothManager.prototype.listfile = function(data, success,fail){
	  var rpc = webinos.rpcHandler.createRPC(this, "listfile",arguments);
          webinos.rpcHandler.executeRPC(rpc, function(params) {
			success(params);
	   }, function(error) {
		  fail(error);
	   });
	  return;
	};
	
	BluetoothManager.prototype.transferfile = function(data, success,fail){
	  var rpc = webinos.rpcHandler.createRPC(this, "transferfile",arguments);
          webinos.rpcHandler.executeRPC(rpc, function(params) {
			success(params);
	   }, function(error) {
		  fail(error);
	   });
	  return;
	};
	
}());