 	if (typeof webinos === "undefined") { webinos = {}; }
	if (!webinos.discovery) { webinos.discovery = {}; }

	var localdisc = (process.versions.node < "0.6.0" ) ? require('../src/build/default/bluetooth.node') : require('../src/build/Release/bluetooth.node');

	var BTfindservice = function (){};
  
	BTfindservice = function(serviceType,success){
		n = new localdisc.bluetooth();
		var arg = [];
		arg =  ArgumentHandler(serviceType);
		result = n.scan_device(arg);
		success(result); 
	};
  
  	BTbinddservice = function(service,success){
		n = new localdisc.bluetooth();
		arg = ArgumentHandler(service);

		var result = n.folder_list(arg);
		success(result);
  };
  
  	BTlistfile = function(data,success){
	  n = new localdisc.bluetooth();
     
	  arg = ArgumentHandler(data);
	  lists = n.file_list(arg[0], arg[1]);
	  success(lists);
  };

  	BTtransferfile = function(data,success){

	  n = new localdisc.bluetooth();

    
	  arg = ArgumentHandler(data);
	  result = n.file_transfer(arg[0], arg[1], arg[2]);
	  success(result);
	  console.log("filetransfer result:" + result);
  };
  
  function ArgumentHandler(data)
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
  }
  
	exports.BTfindservice = BTfindservice;
	exports.BTbinddservice = BTbinddservice;
	exports.BTlistfile = BTlistfile;
	exports.BTtransferfile = BTtransferfile;  
