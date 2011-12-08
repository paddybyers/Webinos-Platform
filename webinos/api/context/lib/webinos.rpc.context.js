  if (typeof webinos === 'undefined') var webinos = {};

  webinos.rpc = require('../../../common/rpc/lib/rpc.js');

  var RemoteContextManager = new RPCWebinosService({
    api:'http://webinos.org/api/context',
    displayName:'Context',
    description:'The webinos context manager'
  });

  var moduleRoot = require('../dependencies.json');
  var dependencies = require('../' + moduleRoot.root.location + '/dependencies.json');
  var webinosRoot = '../' + moduleRoot.root.location;

  if (typeof webinos.context === 'undefined'){
    console.log("context was not found!!!");
    webinos.context = {};
  }
  debugger;
  if (typeof webinos.context.DB === 'undefined'){
    console.log("context.DB was not found!!!");
    webinos.context.DB = {};
    webinos.context.DB = require(webinosRoot + dependencies.manager.context_manager.location + 'lib/contextDBpzhManager.js');
  }
  
  RemoteContextManager.find = function ( params,  successCallback,  errorCallback) {
    webinos.context.find(params[0],function(results){
      successCallback(results);
    },function(){

    });
  };

  RemoteContextManager.executeQuery = function(query, successCallback, errorCallback){
    switch(query.type)
    {
      case "DB-insert":
        webinos.context.DB.insert(query.data); //TODO: Add success callback
        break;
      case "getrawview":
        webinos.context.DB.getrawview(function(results){
          successCallback(results);
        });
        break;
      default:
        errorCallback(new ContextError("Context Query Type '" + query.type + "' not found"))
    }

    function VehicleError(message){
      this.message = message;
    }
  }
  webinos.rpc.registerObject(RemoteContextManager);
