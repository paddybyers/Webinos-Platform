if (typeof webinos === 'undefined') {
  webinos = {};
  console.log("webinos not found");
}
if (typeof webinos.context === 'undefined')
  webinos.context = {};
if (typeof webinos.context.app === 'undefined')
  webinos.context.app = {};

var path = require('path');
var moduleRoot = path.resolve(__dirname, '../') + '/';

require(moduleRoot +'/lib/AsciiArt.js')

var commonPaths = require(moduleRoot + '/lib/commonPaths.js');
if (commonPaths.storage === null){
  console.log('[ERROR] User Storage Path not found.\nContext Manager disabled.', 'yellow+black_bg');
  return;
}
require(moduleRoot + '/lib/storageCheck.js')(commonPaths, require(moduleRoot + '/data/storage.json'));

var databasehelper = require('JSORMDB');
var appVocDBpath = path.resolve(commonPaths.storage + '/pzp/appContextVocabulary.json');

webinos.context.app.appVocDB = new databasehelper.JSONDatabase({path : appVocDBpath,transactional : false});
console.log("Log DB Initialized");


webinos.context.app.registerContextObject = function(APPName, ContextObjectName, field, type, logged) {
  //Check if Object Exists
  var cObject;
  webinos.context.app.getContextObjectVoc(APPName, ContextObjectName, function(cObject){    
    if(cObject && cObject.fields){
      var found = false;
      for (var fieldID in cObject.fields){
        if(cObject.fields.hasOwnProperty(fieldID)){
          var efield = cObject.fields[fieldID];
          if(efield.objectName && efield.objectName == field){ //Field already exists           
            found = true;
          }
        }
      }
      if (found == false){ 
        cObject.fields.push({ logged: logged, objectName: field, type: type });
        webinos.context.app.replaceContextObjectFields(APPName, ContextObjectName, cObject, function(success){
          if(success){
            console.log("Added new field " + field + " to application vocabulary.");
          }

        });


        console.log(JSON.stringify(cObject.fields));

      }
      else{
        console.log("The context field " + field + " already exists.");
      }



    }
    else {
      //create new App and context Object
      console.log("Application Context Object NOT found!");
    }
  });
  //Add Object

}


webinos.context.app.getContextObjectVoc = function(appName, contextObjectName, callback) {
  webinos.context.app.appVocDB 

  var where = {join: "and" , terms:[
                                    {field: "APPname", compare: "equals", value: appName},
                                    {field: "ContextObjectName", compare: "equals", value: contextObjectName}
                                    ]
  };
  var fields = {APPname:true,ContextObjectName: true, fields: true};
  var query = {where: where, fields: fields};
  callback(webinos.context.app.appVocDB.query(query)[0]);
}

webinos.context.app.replaceContextObjectFields = function(appName, contextObjectName, contextObject, callback) {
  var where = {join: "and" , terms:[
                                    {field: "APPname", compare: "equals", value: appName},
                                    {field: "ContextObjectName", compare: "equals", value: contextObjectName}
                                    ]
  };
  var fields = {APPname:true,ContextObjectName: true, fields: true};
  var query = {where: where, fields: fields};
  webinos.context.app.appVocDB.remove(query)
  webinos.context.app.appVocDB.insert([contextObject]);

  callback(true);
}

