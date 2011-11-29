if (typeof webinos === 'undefined') {
  webinos = {};
  console.log("webinos not found");
}
if (typeof webinos.context === 'undefined')
  webinos.context = {};

var databasehelper = require('../../../lib/JSORMDB/src/main/javascript/persist');

//Initialize helper classes
var pathclass = require('path');
var Fs = require('fs');

var vocdbpath = pathclass.resolve('../webinos/common/manager/context/data/contextVocabulary.json');
//console.log("CONTEXT Vocabulary DB Initialized");
//var contextdbpath = pathclass.resolve('../Manager/Context/Storage/data/context.json');
//console.log("CONTEXT  DB Initialized");

//webinos.context.vocdatabase = new databasehelper.JSONDatabase({path : vocdbpath,transactional : false});
//webinos.context.contextdatabase = new databasehelper.JSONDatabase({path : vocdbpath,transactional : false});

webinos.context.saveContext = function(dataIn, success, fail) {
  /*
  console.log("Searching for ");

  console.log(dataIn.api);
  console.log("in ");
  console.log(dataIn.method);


  console.log("Try to parse voc:");

  console.log( dataIn);
   */
  var contextVocJSON = JSON.parse(Fs.readFileSync(vocdbpath, 'utf-8'));

  
  for(APIIndex in contextVocJSON){
    if(contextVocJSON[APIIndex].URI == dataIn.api){

      API = contextVocJSON[APIIndex]

      for(cObjectIndex = 0; cObjectIndex < API.ContextObjects.length; cObjectIndex++){
        methods = API.ContextObjects[cObjectIndex].methods;
        searchObjectInArray(methods,dataIn.method, function(methodIndex){
          console.log("Found with function! index = " + methodIndex);
          method = methods[methodIndex];
          cObject = API.ContextObjects[cObjectIndex];
          if (method.inputs){
            for (var inputIndex in method.inputs){
              input = method.inputs[inputIndex];
              
            }
              
          }
          else{
            console.log("Context Object found!");
            console.log("API : " + API.APIname );
            console.log("Method : " + method.objectName);
            console.log("Context Object : " + cObject.objectName);
          }        


        });       

      }
    }
  }
  //success(true);
}

searchObjectInArray = function (array, value, success){
  if (array && value){
    for(var i = 0; i < array.length; i++){
      if (array[i].objectName && array[i].objectName == value){    
        success(i);
        return;
      }
    }
  }
}