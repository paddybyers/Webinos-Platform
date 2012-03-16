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
* Copyright 2012 EPU-National Technical University of Athens
******************************************************************************/

(function() {
	//	console.log("CONTEXT SERVICE LOADED");
	var moduleRoot = require('../dependencies.json');
	var dependencies = require('../' + moduleRoot.root.location
			+ '/dependencies.json');
	var webinosRoot = '../' + moduleRoot.root.location;


	 var appContext = require(webinosRoot
	      + dependencies.manager.context_manager.location
	      + 'lib/appContext.js');
	 

	/**
	 * Webinos Service constructor.
	 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
	 */
	var RemoteContextManager = function(rpcHandler) {
		// inherit from RPCWebinosService
		this.base = RPCWebinosService;
		this.base({
			api : 'http://webinos.org/api/context',
			displayName : 'Context',
			description : 'The webinos context manager'
		});
	};

	RemoteContextManager.prototype = new RPCWebinosService;



	RemoteContextManager.prototype.registerAppContextObject = function(APPName, ContextObjectName, ContextFields, callback) {
	  appContext.registerContextObject(APPName, ContextObjectName, ContextFields, function(response){callback(response);})
	}
	
	RemoteContextManager.prototype.executeQuery = function(query, successCallback, errorCallback) {
		switch (query.type) {
		case "DB-insert"://PZH
		  var contextDB = require(webinosRoot
		      + dependencies.manager.context_manager.location
		      + 'lib/contextDBManagerPZH.js');
			contextDB.insert(query.data); //TODO: Add success callback
			break;
		case "getrawview"://PZH
		  var contextDB = require(webinosRoot
		      + dependencies.manager.context_manager.location
		      + 'lib/contextDBManagerPZH.js');
			contextDB.getrawview(function(results) {
				successCallback(results);
			});
			break;
		case "query": //PZH
		  var contextDB = require(webinosRoot
		      + dependencies.manager.context_manager.location
		      + 'lib/contextDBManagerPZH.js');
			contextDB.query(query.data, function(results) {
				successCallback(results);
			});
		case "saveAppContext"://PZP
		  appContext.saveAppContext(query.APPName, query.ContextObjectName, query.data, function(results){
		    successCallback(results);
		  });
		default:
			errorCallback(new ContextError("Context Query Type '" + query.type + "' not found"))
		}

		function ContextError(message) {
			this.message = message;
		}
	}

	exports.Service = RemoteContextManager;

})();
