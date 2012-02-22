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
* Copyright 2011 Alexander Futasz, Fraunhofer FOKUS
******************************************************************************/
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