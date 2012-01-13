

if (typeof webinos === 'undefined') {
  webinos = {};
  console.log("webinos not found");
}
if (typeof webinos.context === 'undefined')
{
  webinos.context = {};
}

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

var path = require('path');
var moduleRoot = path.resolve(__dirname, '../') + '/';
var moduleDependencies = require(moduleRoot + '/dependencies.json');
var webinosRoot = path.resolve(moduleRoot + moduleDependencies.root.location) + '/';
var dependencies = require(path.resolve(webinosRoot + '/dependencies.json'));
var sessionPzp = require( webinosRoot + '/pzp/lib/session_pzp.js');

require(moduleRoot +'/lib/AsciiArt.js')


var listeners = {};
listeners.id = {};
listeners.fromObjectRef = {};

_RPCHandler.prototype.context_handleMessage = _RPCHandler.prototype.handleMessage;
/*
 * handleMessage = function (message, from, msgid)
 */
_RPCHandler.prototype.handleMessage = function(){
	if (arguments[0].jsonrpc) {
		var message = arguments[0];
		if (message.fromObjectRef){
			if (typeof listeners.fromObjectRef[message.fromObjectRef] == "object") 
				console.log("######## fromObjectRef: " + message.fromObjectRef + " already inuse. Replacing existing one.");
			listeners.fromObjectRef[message.fromObjectRef] = message;
		}else{
			if (typeof listeners.id[message.id] == "object") 
				console.log("######## id: " + message.id + " already inuse. Replacing existing one.");
			listeners.id[message.id] = message;
		}
	}
	this.context_handleMessage.apply(this, arguments)
}
_RPCHandler.prototype.context_executeRPC = _RPCHandler.prototype.executeRPC;
/*
 * executeRPC = function (rpc, callback, errorCB, from, msgid)
 */
_RPCHandler.prototype.executeRPC = function(){
	if (arguments[0].jsonrpc) {
		var message;
		var res = arguments[0];
		var patt = /^(\d+)\.[\S]+$/i;
		var fromObjectRef = patt.exec(res.method);
		if (fromObjectRef !== null){
			fromObjectRef = fromObjectRef[1];
			message = listeners.fromObjectRef[fromObjectRef];
			if (!res.result) res.result = res.params;
		}else{
			message = listeners.id[res.id];
			delete listeners.id[res.id];
		}
		if (message == undefined){
			console.log("WARNING: Check rpc response. Not in expected format.", 'yellow+black_bg');
		}else{
			webinos.context.logContext(message, res);
		}
	}
	this.context_executeRPC.apply(this, arguments)
}

//console.log("moduleRoot: "+moduleRoot);
//console.log("webinosRoot: "+webinosRoot);
//console.log("context_managerRoot: "+webinosRoot+dependencies.manager.context_manager.location);

//Require the database class
var databasehelper = require('JSORMDB');

//Initialize helper classes
var dbpath = path.resolve(webinosRoot + '/../storage/context/pzp/log.json');
require(moduleRoot + '/lib/contextExtraction.js');

var registeredListeners = [];


//Open the database

webinos.context.database = new databasehelper.JSONDatabase({path : dbpath,transactional : false});
console.log("Log DB Initialized");

webinos.context.logContext = function(myObj, res) {
  if (!res['result']) res['result']={};

  // Create the data object to log
  var myData = new webinos.context.ContextData(myObj['method'],myObj['params'], res['result']);

  var dataIn = {timestamp:myData.timestamp, api: myData.call.api, hash: myData.call.hash, method: myData.call.method, params:myData.params, result:myData.results};
  var dataInLog = {timestamp:myData.timestamp, api: myData.call.api, hash: myData.call.hash, method: myData.call.method, session: sessionPzp.getPzpId()};


  //Don't log Context API calls
  if (!(myData.call.api =='http://webinos.org/api/context'))
  {
    webinos.context.database.insert([dataInLog]);
    console.log(" Context Data Saved");
    webinos.context.saveContext(dataIn);
  }
};

webinos.context.logListener = function(myObj){
  // Create the data object to log
  var myData = new webinos.context.ContextData(myObj['method'],myObj['params'], '');

  var dataIn = {timestamp:myData.timestamp, api: myData.call.api, hash: myData.call.hash, method: myData.call.method, params:myData.params, result:myData.results};


  if (myData.call.api && !(myData.call.api =='http://webinos.org/api/context'))
  {
    regListener = {};
    regListener.dataIn = dataIn;
    regListener.ObjectRef = myObj.fromObjectRef;

    registeredListeners[registeredListeners.length] = regListener;

    //Don't log Context API calls

    webinos.context.database.insert([dataIn]);
    console.log(" Context Data Saved");
    webinos.context.saveContext(dataIn);
  }
}


/*
webinos.context.find = function(findwhat, success,fail){
  var where = {field: "method", compare: "equals", value: "onchannelchangeeventhandler"};
  var fields = {params: true};
  var query = {where: where, fields: fields};
  var results =  webinos.context.database.query(query);
  var output ={};
  results.forEach(function(element, index, array){
    console.log(element);
    if (output[element.params.name] == null) output[element.params.name] = 1;
    else output[element.params.name] +=1;
  });
  success(output);
  console.log("closing up");

};
 */
