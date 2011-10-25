//var interceptRPC;

//interceptRPC = function(){};

if (typeof webinos === 'undefined') {
	webinos = {};
	console.log("webinos not found");
}
if (typeof webinos.context === 'undefined')
	webinos.context = {};

//This class represents the context objects that will be logged
webinos.context.ContextData = function(method, params, results) {
			this.timestamp = new Date();
		    var methodItm ={};
		    methodItm.api = method.substring(0,method.indexOf("@"));
		    methodItm.hash = method.substring(method.indexOf("@")+1,method.substring(method.indexOf("@")).indexOf(".")+ method.indexOf("@"));
		    methodItm.method = method.substring(method.lastIndexOf(".")+1);
			this.call = methodItm;
			this.params = params;
			this.results = results;
		};
		// Require the database class
		var databasehelper = require('./../Storage/src/main/javascript/persist');

		// Initialize helper classes
		var pathclass = require('path');
		var fsclass = require('fs');

		var dbpath = pathclass
				.resolve('../Manager/Context/Storage/data/context.json');
		console.log("CONTEXT DB Initialized");

		// Open the database
		webinos.context.database = new databasehelper.JSONDatabase({path : dbpath,transactional : false});		
		
webinos.context.logContext = function(myObj, res) {
	
	
			// Create the data object to log
			var myData = new webinos.context.ContextData(myObj['method'],myObj['params'], res['result']);
			
			var dataIn = [{timestamp:myData.timestamp, call: myData.call, params:myData.params, result:myData.results}];
			
			webinos.context.database.insert(dataIn);
			console.log("SAVED CONTEXT DATA");
		};
	
