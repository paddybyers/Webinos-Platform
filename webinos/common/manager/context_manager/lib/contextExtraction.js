if (typeof webinos === 'undefined') {
  webinos = {};
  console.log("webinos not found");
}
if (typeof webinos.context === 'undefined')
  webinos.context = {};

var databasehelper = require('../contrib/JSORMDB/src/main/javascript/persist');

//Initialize helper classes
var pathclass = require('path');
var Fs = require('fs');
console.log("current directory:");
console.log(pathclass.resolve(__dirname + '/../' +'data/contextVocabulary.json'));
var vocdbpath = pathclass.resolve(__dirname + '/../' +'data/contextVocabulary.json');
//console.log("CONTEXT Vocabulary DB Initialized");
//var contextdbpath = pathclass.resolve('../Manager/Context/Storage/data/context.json');
//console.log("CONTEXT  DB Initialized");

//webinos.context.vocdatabase = new databasehelper.JSONDatabase({path : vocdbpath,transactional : false});
//webinos.context.contextdatabase = new databasehelper.JSONDatabase({path : vocdbpath,transactional : false});

webinos.context.saveContext = function(dataIn, success, fail) {

  var contextVocJSON = JSON.parse(Fs.readFileSync(vocdbpath, 'utf-8'));


  var paramstolog = [];
  var resultstolog = [];
  var findObjectsToStore = function(vocList, callList, arrayToFill){
    for (callItem in callList){
      for (vocItem in vocList){
        if (callItem == vocList[vocItem].objectName && vocList[vocItem].logged == true){
          if(vocList[vocItem].type == "object"){
            findObjectsToStore(vocList[vocItem].values, callList[callItem],arrayToFill);
            break;
          }
          else{
            var data = {};
            data.objectName = callItem;
            data.value = callList[callItem];
            arrayToFill[arrayToFill.length] = data;
            break;
          }
        }

      }
    }

  }

  //Find all methods in all APIs
  //Find all input values for all methods
  //

  //function to find

  //Find API
  for(APIIndex in contextVocJSON){
    if(contextVocJSON[APIIndex].URI == dataIn.api){
      API = contextVocJSON[APIIndex]      
      //API found

      //Look for Context Objects with the method
      for(cObjectIndex in API.ContextObjects){
        cObject = API.ContextObjects[cObjectIndex];
        methods = API.ContextObjects[cObjectIndex].methods;

        for(methodIndex in methods){
          if(methods[methodIndex].objectName == dataIn.method){
            method = methods[methodIndex];
            if (method.inputs){
              inputs = method.inputs;
              expectedInputsLength = inputs.length;
              inputsCount = 0;
              for(paramName in dataIn.params){
                for (inputIndex in inputs){
                  if (inputs[inputIndex].objectName == paramName){
                    inputsCount++;
                    break;
                  }
                }
              }
              //Found our method!
              if (expectedInputsLength == inputsCount){
                console.log("Context Object found!");
                console.log("API : " + API.APIname );
                console.log("Method : " + method.objectName);
                console.log("Context Object : " + cObject.objectName);
                findObjectsToStore(method.inputs,dataIn.params,paramstolog);
               
                findObjectsToStore(method.outputs,dataIn.result,resultstolog);
                console.log("Params to store in Context DB:");
                console.log(paramstolog);
                console.log("Outputs to store in Context DB:");
                console.log(resultstolog);
                break;
              }

            }
            else{
              console.log("Context Object found!");
              console.log("API : " + API.APIname );
              console.log("Method : " + method.objectName);
              console.log("Context Object : " + cObject.objectName);

              findObjectsToStore(method.outputs,dataIn.result,resultstolog);
              console.log("Params to store in Context DB:");
              console.log(paramstolog);
              console.log("Outputs to store in Context DB:");
              console.log(resultstolog);
              break;
            }
          }
        }
      }
    }
  }
  //success(true);
}