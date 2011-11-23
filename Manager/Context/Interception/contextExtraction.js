if (typeof webinos === 'undefined') {
  webinos = {};
  console.log("webinos not found");
}
if (typeof webinos.context === 'undefined')
  webinos.context = {};

var databasehelper = require('./../Storage/src/main/javascript/persist');

//Initialize helper classes
var pathclass = require('path');
var Fs = require('fs');

var vocdbpath = pathclass.resolve('../Manager/Context/Storage/data/contextVocabulary.json');
console.log("CONTEXT Vocabulary DB Initialized");
var contextdbpath = pathclass.resolve('../Manager/Context/Storage/data/context.json');
console.log("CONTEXT  DB Initialized");

webinos.context.vocdatabase = new databasehelper.JSONDatabase({path : vocdbpath,transactional : false});
webinos.context.contextdatabase = new databasehelper.JSONDatabase({path : vocdbpath,transactional : false});

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
  for(var i = 0; i < contextVocJSON.length; i++){
    if(contextVocJSON[i].URI == dataIn.api){
     
      API = contextVocJSON[i]

      for(var j = 0; j < API.ContextObjects.length; j++){
        methods = API.ContextObjects[j].methods;
       
        for(var k = 0; k < methods.length; k++){

          if( methods[k].objectName  && methods[k].objectName == dataIn.method){
            console.log("Context Object found!");
               console.log("API : " + contextVocJSON[i].APIname );
               console.log("Method : " + methods[k].objectName);
               console.log("Context Object : " + API.ContextObjects[j].objectName);
          }         
        }        
      }
    }
  }




  //success(true);

}