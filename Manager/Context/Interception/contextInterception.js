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
//Require the database class
var databasehelper = require('./../Storage/src/main/javascript/persist');

//Initialize helper classes
var pathclass = require('path');
var Fs = require('fs');

var dbpath = pathclass.resolve('../Manager/Context/Storage/data/context.json');
console.log("CONTEXT DB Initialized");
var logCount = 0;


pathclass.exists(pathclass.dirname(dbpath) + "/temp", function (exists) {
  if (! exists)
  {
    console.log("Context temp folder created")
    Fs.mkdirSync(pathclass.dirname(dbpath) + "/temp", 0755);
  }
});

//Open the database
webinos.context.database = new databasehelper.JSONDatabase({path : pathclass.dirname(dbpath) + "/temp/" + pathclass.basename(dbpath),transactional : false});
webinos.context.tempDatabase = new databasehelper.JSONDatabase({path : dbpath,transactional : false});		

webinos.context.logContext = function(myObj, res) {


  // Create the data object to log
  var myData = new webinos.context.ContextData(myObj['method'],myObj['params'], res['result']);

  var dataIn = [{timestamp:myData.timestamp, api: myData.call.api, hash: myData.call.hash, method: myData.call.method, params:myData.params, result:myData.results}];
  //var dataIn = [{timestamp:myData.timestamp, call: myData.call, params:myData.params, result:myData.results}];
  //var dataIn = [{timestamp:myData.timestamp, call: myData.call, params:myData.params, result:myData.results}];

  console.log('Prepare to log ' + myData.call.api );
  console.log('Is it not context? ' + !(myData.call.api =='http://webinos.org/api/context'));
  if(logCount >= 10 &&  !(myData.call.api =='http://webinos.org/api/context'))
  {
    logCount =0;
    var securestore = require('../../Storage/src/main/javascript/securestore.js');
    //var path = require('path');
    var pass = "nruowgunrwognworu2";
    //var pass = "";

    //open secure storage database
    securestore.open(pass, dbpath + ".zip", pathclass.dirname(dbpath)
        + "/temp", function() {
      console.log("Encrypted Context file opened: " + dbpath + ".zip");

      webinos.context.tempDatabase.insert(dataIn);


      webinos.context.database.insert(JSON.parse(Fs.readFileSync(dbpath, 'utf-8')));
      webinos.context.tempDatabase.remove();

      securestore.close(pass, dbpath + ".zip", pathclass
          .dirname(dbpath)
          + "/temp", function() {
        console.log("Encrypted Context file closed: " + dbpath + ".zip");
        //Fs.writeFileSync(dbpath,"",'utf-8');
        Fs.mkdirSync(pathclass.dirname(dbpath) + "/temp", 0755);
        console.log("Secure Context Data Saved");

      });
    });
  }
  else if (!(myData.call.api =='http://webinos.org/api/context'))
  {
    webinos.context.tempDatabase.insert(dataIn);
    logCount +=1;
    console.log("Temporary Context Data Saved");
    console.log(logCount);




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
  var securestore = require('../../Storage/src/main/javascript/securestore.js');
  //var path = require('path');
  var pass = "nruowgunrwognworu2";
  //var pass = "";


  //open secure storage database
  securestore.open(pass, dbpath + ".zip", pathclass.dirname(dbpath)
      + "/temp", function() {
    console.log("Encrypted Context file opened: " + dbpath + ".zip");



    webinos.context.database.insert(JSON.parse(Fs.readFileSync(dbpath, 'utf-8')));

    
    webinos.context.tempDatabase.remove();
    
    
    logCount =0;


    // where = {join: "and", terms: [{field: "api", compares: "equals", value: "http://webinos.org/api/test"},{field: "method", compares: "equals", value: "get42"}]};
    var where = {field: "method", compare: "equals", value: "setChannel"};

    var fields = {params: true};
    var query = {where: where, fields: fields};

    var results =  webinos.context.database.query(query);
    
    console.log(results);
    var output ={};
    results.forEach(function(element, index, array){
      console.log(element);
      if (output[element.params[0].name] == null) output[element.params[0].name] = 1;
      else output[element.params[0].name] +=1;
    });
    console.log(output);
    success(output);
    console.log("closing up")
    securestore.close(pass, dbpath + ".zip", pathclass
        .dirname(dbpath)
        + "/temp", function() {
      console.log("Encrypted Context file closed: " + dbpath + ".zip");
      //Fs.writeFileSync(dbpath,"",'utf-8');
      Fs.mkdirSync(pathclass.dirname(dbpath) + "/temp", 0755);
      console.log("Secure Context Data Saved");


    });
  });

};

