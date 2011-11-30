if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('../../../common/rpc/src/main/javascript/rpc.js');
(function () {

  var RemoteContextManager = new RPCWebinosService({
    api:'http://webinos.org/api/context',
    displayName:'Context',
    description:'The webinos context manager'
  });
  
  
  RemoteContextManager.find = function ( params,  successCallback,  errorCallback) {
    webinos.context.find(params[0],function(results){
      successCallback(results);
    },function(){
      
    });
  };

  webinos.rpc.registerObject(RemoteContextManager);

})();