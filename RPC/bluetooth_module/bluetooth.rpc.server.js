(function () {
  //WARNING: THIS FILE WILL CHANGE! It was made for the review meeting and is not 
  //based on the actual bluetooth manager authors
  
  var ft = require('../../Manager/Discovery/Demos/Bluetooth_discovery/bluetooth/build/default/bluetooth.node');
  
  var BluetoothManager = new RPCWebinosService({
		api:'http://webinos.org/manager/discovery/bluetooth',
		displayName:'Bluetooth discovery manager',
		description:'A simple bluetooth discovery manager'
	});
  
  BluetoothManager.findservice = function(data,success,fail){
    n = new ft.bluetooth();
    data = data + '';
    result = n.scan_device(data);
    success(data);
  };
  
  BluetoothManager.binddevice = function(data,success,fail){
     n = new ft.bluetooth();
     var result = n.folder_list(data);
     success(data);
  };
  
  BluetoothManager.listfile = function(data,success,fail){
     n = new ft.bluetooth();
	   //lists = n.file_list(data[0], data[1]);
	   var str1 = "/";
	   //lists = n.file_list(data[0], data[1]);
	   lists = n.file_list(data[0], str1.concat(data[1]));
	   success(lists);
  };
  
  BluetoothManager.transferfile = function(data,sucess,fail){
    n = new ft.bluetooth();
    n.file_transfer(data[0], data[1], data[2]);
    success();
  };
  
  webinos.rpc.registerObject(BluetoothManager);
  
})();