(function() {
	
	BluetoothManager = function(obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	BluetoothManager.prototype = new WebinosService;

	BluetoothManager.prototype.findservices = function(data, success,fail){
	  var rpc = webinos.rpc.createRPC(this, "findservice",arguments);
          webinos.rpc.executeRPC(rpc, function(params) {
			success(params);
	   }, function(error) {
		  fail(error);
	   });
	  return;
	};
	
	BluetoothManager.prototype.binddevice = function(data, success,fail){
	  var rpc = webinos.rpc.createRPC(this, "binddevice",arguments);
          webinos.rpc.executeRPC(rpc, function(params) {
			success(params);
	   }, function(error) {
		  fail(error);
	   });
	  return;
	};
	
	BluetoothManager.prototype.listfile = function(data, success,fail){
	  var rpc = webinos.rpc.createRPC(this, "listfile",arguments);
          webinos.rpc.executeRPC(rpc, function(params) {
			success(params);
	   }, function(error) {
		  fail(error);
	   });
	  return;
	};
	
	BluetoothManager.prototype.transferfile = function(data, success,fail){
	  var rpc = webinos.rpc.createRPC(this, "transferfile",arguments);
          webinos.rpc.executeRPC(rpc, function(params) {
			success(params);
	   }, function(error) {
		  fail(error);
	   });
	  return;
	};
}());