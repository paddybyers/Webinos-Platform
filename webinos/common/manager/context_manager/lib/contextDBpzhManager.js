if (typeof webinos === 'undefined') {
  webinos = {};
  console.log("webinos not found");
}
if (typeof webinos.context === 'undefined')
  webinos.context = {};
if (typeof webinos.context.DB === 'undefined')
  webinos.context.DB = {};

//var sqlite3 = require('sqlite3').verbose
var sqlite3 = require('../contrib/node-sqlite3/').verbose();
var pathclass = require('path');
var moduleRoot = require('../dependencies.json');
var dependencies = require('../' + moduleRoot.root.location + '/dependencies.json');
var webinosRoot = '../' + moduleRoot.root.location;
var dbpath = pathclass.resolve(__dirname + '/../' + webinosRoot + '/storage/context/pzh/contextDB.db');
var db =  new sqlite3.Database(dbpath);

webinos.context.DB.insert = function(contextData, success, fail) {
  var inContextRAW = db.prepare("INSERT INTO tblcontextraw (fldAPI, fldDevice, fldApplication, fldSession, fldContextObject, fldMethod, fldTimestamp) VALUES (?,?,?,?,?,?,?)");
  var contextItem = {};
  for (contextItemID=0; contextItemID < contextData.length; contextItemID++) {

    var that=this;
    var contextItem = contextData[contextItemID];
    inContextRAW.run(contextItem.API, contextItem.device, contextItem.application, contextItem.session, contextItem.contextObject, contextItem.method, contextItem.timestamp,function(err1) {
      if (err1) throw err1;

      var fldcontextrawID = this.lastID;
      var incontextrawvalues = db.prepare("INSERT INTO tblcontextrawvalues (fldContextRAWID, fldValueTypeID, fldValueName, fldValue) VALUES (?,?,?,?)");

      for (inputID=0; inputID < contextItem.paramstolog.length; inputID++) {
        var input = contextItem.paramstolog[inputID];
        incontextrawvalues.run(fldcontextrawID, 1, input.objectName, input.value, function(err) {
          if (err) throw err;
        });
      }
      for (outputID=0; outputID < contextItem.resultstolog.length; outputID++) {
        var output = contextItem.resultstolog[outputID];
        incontextrawvalues.run(fldcontextrawID, 2, output.objectName, output.value, function(err) {
          if (err) throw err;
        });
      }
    });
  }
}  