//var sqlite3 = require('sqlite3').verbose
var sqlite3 = require('../contrib/node-sqlite3/').verbose();
var pathclass = require('path');
var moduleRoot = require('../dependencies.json');
var dependencies = require('../' + moduleRoot.root.location + '/dependencies.json');
var webinosRoot = '../' + moduleRoot.root.location;
var dbpath = pathclass.resolve(__dirname + '/../' + webinosRoot + '/storage/context/pzh/contextDB.db');
var bufferpath = pathclass.resolve(__dirname + '/../' + webinosRoot + '/storage/context/pzp/contextDBbuffer.json');
var db =  new sqlite3.Database(dbpath);
var databasehelper = require('../contrib/JSORMDB/src/main/javascript/persist');
bufferDB = new databasehelper.JSONDatabase({path : bufferpath,transactional : false});



exports.insert = function(contextData, success, fail) {
  var PZHonline = true;
  if(PZHonline){
    bufferDB.db.load();
    bufferDB.insert(contextData);
    var data = bufferDB.query();
    saveToDB(data, function(){
      console.log("Successfully commited " + data.length + " Context Objects to the PZH");
      bufferDB.db.clear();
      bufferDB.commit();
      //success();
    },function(){
      console.log("Error commiting Context Objects to the PZH");
      //fail();
    });

  }
  else{
    bufferDB.insert(contextData);//TODO: Add Success and fail callbacks
    //success();
  }
}


saveToDB = function(contextData, success, fail) {
  var inContextRAW = db.prepare("INSERT INTO tblcontextraw (fldAPI, fldDevice, fldApplication, fldSession, fldContextObject, fldMethod, fldTimestamp) VALUES (?,?,?,?,?,?,?)");
  var contextItem = {};
  for (contextItemID=0; contextItemID < contextData.length; contextItemID++) {

    var that=this;
    var contextItem = contextData[contextItemID];
    inContextRAW.run(contextItem.API, contextItem.device, contextItem.application, contextItem.session, contextItem.contextObject, contextItem.method, contextItem.timestamp,function(err1) {
      if (err1){ 
        throw err1;
        fail();  
      }

      var fldcontextrawID = this.lastID;
      var incontextrawvalues = db.prepare("INSERT INTO tblcontextrawvalues (fldContextRAWID, fldValueTypeID, fldValueName, fldValue) VALUES (?,?,?,?)");

      for (inputID=0; inputID < contextItem.paramstolog.length; inputID++) {
        var input = contextItem.paramstolog[inputID];
        incontextrawvalues.run(fldcontextrawID, 1, input.objectName, input.value, function(err) {
          if (err) {
            throw err;
            fail(); 
          }
        });
      }
      for (outputID=0; outputID < contextItem.resultstolog.length; outputID++) {
        var output = contextItem.resultstolog[outputID];
        incontextrawvalues.run(fldcontextrawID, 2, output.objectName, output.value, function(err) {
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
  var result = [];
  db.each("SELECT fldcontextrawID AS ContextRawID,  " +
      "fldcontextrawvalueID AS ContextRawValueID,  fldAPI AS API, fldDevice AS Device, fldApplication AS Application, " +
      "fldSession AS Session, fldContextObject AS ContextObject, fldMethod AS Method, fldTimestamp AS Timestamp, " +
      "fldDescription AS ValueType, fldValueName AS ValueName, fldValue AS Value FROM vwcontextraw", function (err,row){
    var txtRow = "";
    txtRow = txtRow + "ContextRawID : " + row.ContextRawID + 
    " | ContextRawValueID : "  + row.ContextRawValueID +
    " | API : "  + row.API +
    " | Device : "  + row.Device +
    " | Application : "  + row.Application +
    " | Session : "  + row.Session +
    " | ContextObject : "  + row.ContextObject +
    " | Method : "  + row.Method +
    " | Timestamp : "  + row.Timestamp +
    " | ValueType : "  + row.ValueType +
    " | ValueName : "  + row.ValueName +
    " | Value : "  + row.Value;


    result[result.length] = txtRow;      

  },function(){
    success(result);
  });

}

