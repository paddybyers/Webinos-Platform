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
* Copyright 2012 Samsung Electronics(UK) Ltd
*
******************************************************************************/
(function () {

	/**
	 * Webinos Bluetooth Discovery service constructor (client side).
	 * @constructor
	 * @param obj Object containing displayName, api, etc.
	 */
	BluetoothManager = function (obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	
	BluetoothManager.prototype = new WebinosService();
	
	/**
	 * To find devices that support the specific service. This applies to both Android and Linux
	 * @param data Service type.
	 * @param success Success callback.
	 */
	BluetoothManager.prototype.BTfindservice = function (data, success) {
		console.log("BT findservice");
		var rpc = webinos.rpcHandler.createRPC(this, "BTfindservice", data);
		webinos.rpcHandler.executeRPC(rpc, function(params) {
			success(params);
		});
	};
	
	/**
	 * To find Heart Rate Monitor device, only support Android OS.
	 * @param data Service type.
	 * @param success Success callback.
	 */

	BluetoothManager.prototype.findHRM = function(data, success){
		console.log("HRM find HRM");
  		var rpc = webinos.rpcHandler.createRPC(this, "findHRM",data);
	  	webinos.rpcHandler.executeRPC(rpc, function(params) {
	  		success(params);
	  	});
	};

	/**
	 * To bind with found device that has the service requested. It lists all 
	 * file folders in the device.
	 * @param data Device address.
	 * @param success Success callback.
	 */
	BluetoothManager.prototype.bindservice = function(data, success){
		console.log("Linux BT bindservice");
		var rpc = webinos.rpcHandler.createRPC(this, "bindservice",arguments);
	  	webinos.rpcHandler.executeRPC(rpc, function(params) {
	  		success(params);
	  	});
	};

	/**
	 * To get file list of selected folder in the bonded device
	 * @param data File folder.
	 * @param success Success callback.
	 */
	BluetoothManager.prototype.listfile = function(data, success){
		console.log("Linux BT listfile");
		var rpc = webinos.rpcHandler.createRPC(this, "listfile",arguments);
		webinos.rpcHandler.executeRPC(rpc, function(params) {
			success(params);
		});
	};
	
	/**
	 * To transfer selected file from the bonded device
	 * @param data Selected file.
	 * @param success Success callback.
	 */

	BluetoothManager.prototype.transferfile = function(data, success){
		console.log("Linux BT transferfile");
		var rpc = webinos.rpcHandler.createRPC(this, "transferfile",arguments);
		webinos.rpcHandler.executeRPC(rpc, function(params) {
			success(params);
		});
	};
}());
