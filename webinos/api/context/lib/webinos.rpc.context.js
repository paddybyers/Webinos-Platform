(function() {
//	console.log("CONTEXT SERVICE LOADED");
  var moduleRoot = require('../dependencies.json');
  var dependencies = require('../' + moduleRoot.root.location + '/dependencies.json');
  var webinosRoot = '../' + moduleRoot.root.location;
  
  var contextDB = require(webinosRoot + dependencies.manager.context_manager.location + 'lib/contextDBpzhManager.js');

  /**
   * Webinos Service constructor.
   * @param rpcHandler A handler for functions that use RPC to deliver their result.  
   */
  var RemoteContextManager = function(rpcHandler) {
    // inherit from RPCWebinosService
    this.base = RPCWebinosService;
    this.base({
      api:'http://webinos.org/api/context',
      displayName:'Context',
      description:'The webinos context manager'
    });
  };
  
  RemoteContextManager.prototype = new RPCWebinosService;

//TODO: RegisterContextEvent

  RemoteContextManager.prototype.executeQuery = function(query, successCallback, errorCallback){
    switch(query.type)
    {
      case "DB-insert":
        contextDB.insert(query.data); //TODO: Add success callback
        break;
      case "getrawview":
        contextDB.getrawview(function(results){
          successCallback(results);
        });
        break;
      default:
        errorCallback(new ContextError("Context Query Type '" + query.type + "' not found"))
    }

    function ContextError(message){
      this.message = message;
    }
  }
  
  exports.Service = RemoteContextManager;

})();
