

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
//Require the database class
var databasehelper = require('../contrib/JSORMDB/src/main/javascript/persist');

//Initialize helper classes
var pathclass = require('path');
var Fs = require('fs');

var moduleRoot = require('../dependencies.json');
var dependencies = require('../' + moduleRoot.root.location + '/dependencies.json');
var webinosRoot = '../' + moduleRoot.root.location;
var dbpath = pathclass.resolve(__dirname + '/../' + webinosRoot + '/storage/context/pzp/log.json');
require('./contextExtraction.js');



//Open the database

webinos.context.database = new databasehelper.JSONDatabase({path : dbpath,transactional : false});
console.log("Log DB Initialized");

webinos.context.logContext = function(myObj, res) {
  if (!res['result']) res['result']={};

  //console.log(myObj);
  // Create the data object to log
  var myData = new webinos.context.ContextData(myObj['method'],myObj['params'], res['result']);

  var dataIn = {timestamp:myData.timestamp, api: myData.call.api, hash: myData.call.hash, method: myData.call.method, params:myData.params, result:myData.results};


  //Don't log Context API calls
  if (!(myData.call.api =='http://webinos.org/api/context'))
  {
    webinos.context.database.insert([dataIn]);
    console.log(" Context Data Saved");
    webinos.context.saveContext(dataIn);
  }
};

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

