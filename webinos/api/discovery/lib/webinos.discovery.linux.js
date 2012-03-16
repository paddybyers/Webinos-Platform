/*******************************************************************************
*  Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Copyright 2011 Samsung Electronics UK Ltd (SERI)
* 
******************************************************************************/ 	

if (typeof webinos === "undefined") { webinos = {}; }
if (!webinos.discovery) { webinos.discovery = {}; }

	var localdisc = (process.versions.node < "0.6.0" ) ? require('../src/build/default/bluetooth.node') : require('../src/build/Release/bluetooth.node');

	BTfindservice = function(serviceType,success){
		n = new localdisc.bluetooth();
		var arg = [];
		arg =  ArgumentHandler(serviceType);
		result = n.scan_device(arg);
		success(result); 
	};
  
  	BTbindservice = function(service,success){
		console.log("linux.discovery: BTbindservice");
		n = new localdisc.bluetooth();
		var args = [];
		args[0] = ArgumentHandler(service);
		args[1] = "folder";

		var result = n.file_transfer(args[0], args[1]);
		console.log("discovery.linux bindservice result:" + result);
		success(result);
  };
  
  	BTlistfile = function(data,success){
	  n = new localdisc.bluetooth();
     
	  arg = ArgumentHandler(data);
	  //insert "file" 		
	  var args = [];
	  args[0] = arg[0];
	  args[1] = "file";
	  args[2] = arg[1];
	  lists = n.file_transfer(args[0], args[1], args[2]);
	  success(lists);
  };

  	BTtransferfile = function(data,success){

	  n = new localdisc.bluetooth();

	  arg = ArgumentHandler(data);
	  //insert "transfer"	
	  var args = [];
	  args[0] = arg[0];
	  args[1] = "transfer";
	  args[2] = arg[1];
	  args[3] = arg[2];
			
	  result = n.file_transfer(args[0], args[1], args[2], args[3]);
	  success(result);
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
	exports.BTbindservice = BTbindservice;
	exports.BTlistfile = BTlistfile;
	exports.BTtransferfile = BTtransferfile;  
