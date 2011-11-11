(function () {
  
  var ft = require('../../Manager/Discovery/Demos/Bluetooth_discovery/bluetooth/build/default/bluetooth.node');
  
  ArgumentHandler = function(data)
  {
	  var args = [];
	  data = JSON.stringify(data);

	  var index = data.indexOf("[");
	  if(index > 0)
	  {
		  //argument array
		  var ends = data.indexOf("]");
		  var string = data.substring(index +1, ends - 1);
		  args = string.split(",");
		  console.log ("args.length:" + args.length);
		  for(var i = 0; i < args.length; i++ )
		  {
			  console.log("args[i] =" + args[i]);
			  args[i] = args[i].replace(/['"]/g,'');
			  console.log("after args[i] =" + args[i]);
		  }
		  return args;
	  }
	  else
	  {
		  //skip "0" -> am I hard coding here?
		  var first = data.indexOf(":");
		  var arg = data.substring(first+1, data.length - 1);
		  //strip off ""
		  arg = arg.replace(/['"]/g,'');
		  return arg;
	  }
  };
  
  var BluetoothManager = new RPCWebinosService({
		api:'http://webinos.org/manager/discovery/bluetooth',
		displayName:'Bluetooth discovery manager',
		description:'A simple bluetooth discovery manager'
  });
  
  BluetoothManager.findservice = function(data,success,fail){
		n = new ft.bluetooth();
		
		var arg = [];
		arg =  ArgumentHandler(data);
		result = n.scan_device(arg);
		success(result);
  };
  
  BluetoothManager.binddevice = function(data,success,fail){
		n = new ft.bluetooth();
		arg = ArgumentHandler(data);

		var result = n.folder_list(arg);
		success(result);
  };
  
  BluetoothManager.listfile = function(data,success,fail){
	  n = new ft.bluetooth();
     
	  arg = ArgumentHandler(data);
	  lists = n.file_list(arg[0], arg[1]);
	  success(lists);
  };
  
  BluetoothManager.transferfile = function(data,success,fail){
	  n = new ft.bluetooth();
    
	  arg = ArgumentHandler(data);
	  result = n.file_transfer(arg[0], arg[1], arg[2]);
	  success(result);
	  console.log("filetransfer result:" + result);
  };
  
  webinos.rpc.registerObject(BluetoothManager);
  
})();