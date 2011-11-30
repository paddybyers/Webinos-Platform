

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
//Require the database class
var databasehelper = require('.../contrib/JSORMDB/src/main/javascript/persist');

//Initialize helper classes
var pathclass = require('path');
var Fs = require('fs');

var dbpath = pathclass.resolve(__dirname + '/../' +'data/log.json');
//var dbpath = "./../../../data/log.json";
console.log
console.log("Log DB Initialized");
var logCount = 0;

var cExtraction =  require('./contextExtraction.js');

/*
pathclass.exists(pathclass.dirname(dbpath) + "/temp", function (exists) {
  if (! exists)
  {
    console.log("Context temp folder created")
    Fs.mkdirSync(pathclass.dirname(dbpath) + "/temp", 0755);
  }

});
 */


//Open the database
//webinos.context.database = new databasehelper.JSONDatabase({path : pathclass.dirname(dbpath) + "/temp/" + pathclass.basename(dbpath),transactional : false});	
webinos.context.database = new databasehelper.JSONDatabase({path : dbpath,transactional : false});
webinos.context.logContext = function(myObj, res) {

  if (!res['result']) res['result']={};

  console.log(myObj);
  // Create the data object to log
  var myData = new webinos.context.ContextData(myObj['method'],myObj['params'], res['result']);

  var dataIn = {timestamp:myData.timestamp, api: myData.call.api, hash: myData.call.hash, method: myData.call.method, params:myData.params, result:myData.results};
  //var dataIn = [{timestamp:myData.timestamp, call: myData.call, params:myData.params, result:myData.results}];
  //var dataIn = [{timestamp:myData.timestamp, call: myData.call, params:myData.params, result:myData.results}];

  //console.log('Prepare to log ' + myData.call.api );
  //console.log('Is it not context? ' + !(myData.call.api =='http://webinos.org/api/context'));
  if (!(myData.call.api =='http://webinos.org/api/context'))
  {

    webinos.context.database.insert([dataIn]);
    logCount +=1;
    console.log(" Context Data Saved");
    console.log(logCount);

    webinos.context.saveContext(dataIn);


  }


//Code to decrypt, unzip and re-encrypt the database for testing purposes
  /*
  securestore.decryptFile(dbpath + ".zip", pass, function() {
          securestore.unzipFile(dbpath + ".zip", function() {
            console.log("Unzipped");
            securestore.encryptFile(dbpath + ".zip", pass, function() {});
          });
        });
   */


  //webinos.context.database.insert(dataIn);

  //console.log(logCount);


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

