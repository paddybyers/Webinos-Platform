if (typeof webinos === 'undefined') {
  webinos = {};
  console.log("webinos not found");
}
if (typeof webinos.context === 'undefined')
  webinos.context = {};

var path = require('path');
var moduleRoot = path.resolve(__dirname, '../') + '/';
var moduleDependencies = require(moduleRoot + '/dependencies.json');
var webinosRoot = path.resolve(moduleRoot + moduleDependencies.root.location) + '/';
var dependencies = require(path.resolve(webinosRoot + '/dependencies.json'));
var databasehelper = require(moduleRoot + '/contrib/JSORMDB');

//Initialize helper classes

var Fs = require('fs');
var vocdbpath = path.resolve(moduleRoot +'/data/contextVocabulary.json');

webinos.context.DB = require(moduleRoot +'/lib/contextDBpzhManager.js')
var sessionPzp = require( webinosRoot + '/pzp/lib/session_pzp.js');

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

  var findObjectsToStore = function(vocList, callList, arrayToFill,objRef){
    if(objRef == undefined){
      objRef = "0";
    }
    //Case if the result is a single unnamed value
    if (vocList.length && vocList.length == 1 && typeof(vocList[0].objectName) != "undefined" && vocList[0].objectName == "" && (typeof callList === vocList[0].type)){
      var data = {};
      data.objectName = "";
      data.ObjectRef=objRef;
      data.IsObject = false;
      data.value = callList;
      arrayToFill[arrayToFill.length] = data;
    }
    //Case if results is an unnamed array
    else if(callList.length  && vocList.length == 1 && vocList[0].type == "array" && vocList[0].objectName == ""){ //Is Array
      var data = {};
      data.objectName = "array";
      data.ObjectRef = objRef;
      data.IsObject = true;
      data.value = objRef + ".";
      arrayToFill[arrayToFill.length] = data;
      for (var arID=0; arID < callList.length; arID++){        
        findObjectsToStore(vocList[0].values, callList[arID],arrayToFill, data.value + arID);
      }
    }
    else{
      for (var callItem in callList){
        if(callList.hasOwnProperty(callItem)){
          for (var vocItem in vocList){
            if(vocList.hasOwnProperty(vocItem)){
              if (callItem == vocList[vocItem].objectName && vocList[vocItem].logged == true){
                if(vocList[vocItem].type == "object"){
                  findObjectsToStore(vocList[vocItem].values, callList[callItem],arrayToFill);
                  break;
                }
                //Case
                else if(vocList[vocItem].type == "array" && vocList[vocItem].logged == true){
                  var tmpObjRef = "";
                  if(objRef == ""){
                    tmpObjRef = objRef + "." + arID;
                  }
                  else{
                    tmpObjRef = arID;
                  }
                  var data = {};
                  data.objectName = callItem;
                  data.ObjectRef = objRef;
                  data.IsObject = true;
                  data.value = objRef + ".";
                  arrayToFill[arrayToFill.length] = data;
                  for (var arID=0; arID < callList[callItem].length; arID++){
                    findObjectsToStore(vocList[vocItem].values, callList[callItem][arID],arrayToFill,data.value + arID);
                  }
                  break;            
                }
                else{
                  var data = {};
                  data.objectName = callItem;
                  data.ObjectRef=objRef;
                  data.IsObject = false;
                  data.value = callList[callItem];
                  arrayToFill[arrayToFill.length] = data;
                  break;
                }
              }
            }
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
              for (inputIndex in inputs){
                for(paramName in dataIn.params){

                  if (inputs[inputIndex].objectName == paramName){
                    inputsCount++;
                    break;
                  }
                  else if(inputs[inputIndex].required === false ){
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
                contextItem.session = sessionPzp.getPzpId();
                contextItem.contextObject = cObject.objectName;
                contextItem.method = method.objectName;
                contextItem.timestamp = new Date().getTime();
                findObjectsToStore(method.inputs,dataIn.params, contextItem.paramstolog);
                findObjectsToStore(method.outputs,dataIn.result,contextItem.resultstolog);


                console.log("Context Object found!");
                console.log("API : " + contextItem.API );
                console.log("Method : " + contextItem.method);
                console.log("Session : " + contextItem.session);
                console.log("Timestamp : " + contextItem.timestamp);
                console.log("Context Object : " + contextItem.contextObject);

                console.log("Params to store in Context DB:");
                console.log(contextItem.paramstolog);
                console.log("Outputs to store in Context DB:");
                console.log(contextItem.resultstolog);
                var contextData = [];
                contextData[0] = contextItem;
                webinos.context.DB.handleContextData(contextData)
                //console.log("Context data saved to Context DB");
                break;
              }

            }
            else{
              contextItem.API = API.APIname;
              contextItem.device = {}; 
              contextItem.application = {};
              contextItem.session = sessionPzp.getPzpId();
              contextItem.contextObject = cObject.objectName;
              contextItem.method = method.objectName;
              contextItem.timestamp = new Date().getTime();
              contextItem.paramstolog = [];
              findObjectsToStore(method.outputs,dataIn.result,resultstolog);


              console.log("Context Object found!");
              console.log("API : " + contextItem.API );
              console.log("Method : " + contextItem.method);
              console.log("Session : " + contextItem.session);
              console.log("Timestamp : " + contextItem.timestamp);
              console.log("Context Object : " + contextItem.contextObject);


              console.log("Params to store in Context DB:");
              console.log(contextItem.paramstolog);
              console.log("Outputs to store in Context DB:");
              console.log(contextItem.resultstolog);
              contextData[0] = contextItem;
              webinos.context.DB.handleContextData(contextData)
              break;
            }
          }
        }
      }
    }
  }
}