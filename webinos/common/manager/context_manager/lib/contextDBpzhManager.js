(function() {
	if (typeof webinos === 'undefined') {
	  webinos = {};
	  console.log("webinos not found");
	}
	if (typeof webinos.context === 'undefined')
	  webinos.context = {};

//	console.log("CONTEXT contextDBpzhManager.js LOADED");
	
	var path = require('path');
	var moduleRoot = path.resolve(__dirname, '../') + '/';

	require(moduleRoot +'/lib/AsciiArt.js')

	var commonPaths = require(moduleRoot + '/lib/commonPaths.js');
	if (commonPaths.storage === null){
		console.log('[ERROR] User Storage Path not found.\nContext Manager disabled.', 'yellow+black_bg');
		return;
	}
	require(moduleRoot + '/lib/storageCheck.js')(commonPaths, require(moduleRoot + '/data/storage.json'));
	
	
	var moduleDependencies = require(moduleRoot + '/dependencies.json');
  var webinosRoot = path.resolve(moduleRoot + moduleDependencies.root.location) + '/';
  var dependencies = require(path.resolve(webinosRoot + '/dependencies.json'));

  var sqlite3 = require('node-sqlite3').verbose();

  var dbpath = path.resolve(commonPaths.storage + '/pzh/contextDB.db');
  var bufferpath = path.resolve(commonPaths.storage + '/pzp/contextDBbuffer.json');
  var db =  new sqlite3.Database(dbpath);
  var databasehelper = require('JSORMDB');
  bufferDB = new databasehelper.JSONDatabase({path : bufferpath, transactional : false});

  webinos.ServiceDiscovery = new _RPCHandler;
  webinos.ServiceDiscovery.loadModules([{name: "context", param: {}}]);

  sessionPzp = require(webinosRoot + '/pzp/lib/pzp_sessionHandling.js');

  ////////////////////////////////////////////////////////////////////////////////////////
  //Running on the PZP
  //////////////////////////////////////////////////////////////////////////////////////
  exports.handleContextData = function(contextData){
    var connectedPzh = sessionPzp.getPzhId();
    if (connectedPzh == "null" || connectedPzh == "undefined"){
      bufferDB.insert(contextData)
      console.log("Successfully commited Context Object to the context buffer");
    }else{
      bufferDB.db.load();
      bufferDB.insert(contextData);
      var data = bufferDB.query();

      var contextService = [];
      var service = webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/context'));
      service[0].serviceAddress = connectedPzh

      var query = {};
      query.type = "DB-insert";
      query.data = data;
      if (service.length == 1){
        service[0].executeQuery(query);
        bufferDB.db.clear();
        bufferDB.commit();
      }
    }
    //success(true);
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  //Running on the PZH
  //////////////////////////////////////////////////////////////////////////////////////
  exports.insert = function(contextData, success, fail) {
    saveToDB(contextData, function(){
      console.log("Successfully commited " + contextData.length + " Context Objects to the context DB on the PZH");
      //success();
    },function(){
      console.log("Error commiting Context Objects to the PZH");
      //fail();
    });
  }
  saveToDB = function(contextData, success, fail) {
    var inContextRAW = db.prepare("INSERT INTO tblcontextraw (fldAPI, fldDevice, fldApplication, fldSession, fldContextObject, fldMethod, fldTimestamp) VALUES (?,?,?,?,?,?,?)");
    var contextItem = {};
    for (contextItemID=0; contextItemID < contextData.length; contextItemID++) {
      var that=this;
      var contextItem = contextData[contextItemID];
      inContextRAW.run(contextItem.API, contextItem.device, contextItem.application, contextItem.session, contextItem.contextObject, contextItem.method, contextItem.timestamp, function(err1) {
        if (err1){ 
          throw err1;
          fail();  
        }

        var fldcontextrawID = this.lastID;
        var incontextrawvalues = db.prepare("INSERT INTO tblcontextrawvalues (fldContextRAWID,fldObjectRef,fldIsObject,fldValueTypeID, fldValueName, fldValueType, fldValue) VALUES (?,?,?,?,?,?,?)");
        for (inputID=0; inputID < contextItem.paramstolog.length; inputID++) {
          var input = contextItem.paramstolog[inputID];
          incontextrawvalues.run(fldcontextrawID, input.ObjectRef, input.IsObject, 1, input.objectName, input.type, input.value, function(err) {
            if (err) {
              throw err;
              fail(); 
            }
          });
        }
        for (outputID=0; outputID < contextItem.resultstolog.length; outputID++) {
          var output = contextItem.resultstolog[outputID];
          incontextrawvalues.run(fldcontextrawID, output.ObjectRef, output.IsObject, 2, output.objectName, output.type, output.value, function(err) {
            if (err) {
              throw err;
              fail();
            }
          });
        }
      });
    }
    success();
  }
  exports.getrawview = function(success,fail){
    var result = {msg:null,data:[]};
    db.each(
        "SELECT fldcontextrawID AS ContextRawID,  " +
        "fldcontextrawvalueID AS ContextRawValueID,  fldAPI AS API, fldDevice AS Device, fldApplication AS Application, " +
        "fldSession AS Session, fldContextObject AS ContextObject, fldMethod AS Method, fldTimestamp AS Timestamp, " +
        "fldDescription AS ValueType, fldValueName AS ValueName, fldValueType AS ValueType, fldValue AS Value FROM vwcontextraw", 
        function (err,row){
          result.data[result.data.length] = row;
        },
        function(err){
          if (err !== null) {
            result.msg = {code:err.code,msg:err.message};
          }
          success(result);
        }
    );
  }
})();