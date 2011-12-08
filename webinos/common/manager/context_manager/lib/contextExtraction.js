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
var vocdbpath = pathclass.resolve(__dirname + '/../' +'data/contextVocabulary.json');

//Test the SQLite DB
require('./contextDBpzhManager.js')
//Test the SQLite DB

webinos.context.saveContext = function(dataIn, success, fail) {

  var contextVocJSON = JSON.parse(Fs.readFileSync(vocdbpath, 'utf-8'));
  var contextItem = {};
  contextItem.API = {};
  contextItem.device = {}; 
  contextItem.application = {};
  contextItem.session = {};
  contextItem.contextObject = {};
  contextItem.method = {};
  contextItem.timestamp = {};
  contextItem.paramstolog = [];
  contextItem.resultstolog = [];


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

                contextItem.API = API.APIname;
                contextItem.device = {}; 
                contextItem.application = {};
                contextItem.session = {};
                contextItem.contextObject = cObject.objectName;
                contextItem.method = method.objectName;
                contextItem.timestamp = {};
                findObjectsToStore(method.inputs,dataIn.params,contextItem.paramstolog);
                findObjectsToStore(method.outputs,dataIn.result,contextItem.resultstolog);


                console.log("Context Object found!");
                console.log("API : " + contextItem.API );
                console.log("Method : " + method.objectName);
                console.log("Context Object : " + cObject.objectName);

                console.log("Params to store in Context DB:");
                console.log(contextItem.paramstolog);
                console.log("Outputs to store in Context DB:");
                console.log(contextItem.resultstolog);
                var contextData = [];
                contextData[0] = contextItem;
                webinos.context.DB.insert(contextData)
                console.log("Context data saved to Context DB");
                break;
              }

            }
            else{
              contextItem.API = API.APIname;
              contextItem.device = {}; 
              contextItem.application = {};
              contextItem.session = {};
              contextItem.contextObject = cObject.objectName;
              contextItem.method = method.objectName;
              contextItem.timestamp = {};
              contextItem.paramstolog = [];
              findObjectsToStore(method.outputs,dataIn.result,resultstolog);


              console.log("Context Object found!");
              console.log("API : " + API.APIname );
              console.log("Method : " + method.objectName);
              console.log("Context Object : " + cObject.objectName);


              console.log("Params to store in Context DB:");
              console.log(contextItem.paramstolog);
              console.log("Outputs to store in Context DB:");
              console.log(contextItem.resultstolog);
              break;
            }
          }
        }
      }
    }
  }

  var sendtoPZH = function(contextData)
  {

    var connectedPzh = {};
    var contextPzh = [];

    if (connectedPzh == "null" || connectedPzh == "undefined"){
      // Generate contectDB insert cache
    }
    else{
      webinos.ServiceDiscovery.findServices(connectedPzh, new ServiceType('http://webinos.org/api/context'),
          {onFound: function (service){
            contextPzh.push(service);
            var query = {};
            query.type = "DB-insert";
            query.data = contextData;
            contextPzh.DB.insert(query);
          }});
    }
  }
  //success(true);
}


