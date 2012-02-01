var path = require('path');
var util = require('util');
var commonPaths = require(path.resolve(__dirname, '../../webinos/common/manager/context_manager/') + '/lib/commonPaths.js');
commonPaths.localTest = path.resolve(__dirname) + '/';
var sqlite3 = require(commonPaths.local + '/node_modules/node-sqlite3').verbose();

var dbpath = path.resolve(commonPaths.storage + '/pzh/contextDB.db');
var db =  new sqlite3.Database(dbpath);

var result = {data:[]};
db.each(
	"SELECT * FROM vwcontextraw WHERE fldcontextrawID IN (SELECT fldcontextrawID FROM vwcontextraw WHERE " +
//	"fldValueName = 'altitude' AND fldValue <= 1" +
	"fldcontextrawID > '1'" +
//	"fldAPI = 'TVAPI2'" +
	")", 
	function (err,row){
		result.data[result.data.length] = row;
	},
	function(err){
		if (err !== null) {
			result.msg = {code:err.code,msg:err.message};
			console.log("ERROR");
			console.log(result);
		}else{
			processResults(result.data);
		}
	}
);

function processResults(result){
	 console.log("\n========================================================\n");
	 
	 var results = [];
	 var resultsIndex = -1;
	 var rawData = [];
	 var rawDataIndex = -1;
	 var curIndex= (result[0])?result[0].fldcontextrawID : null;

	 var saveData = function (myRawData){
		 	if (curIndex == null) return;
	  results[++resultsIndex] = {
	   fldcontextrawID:curIndex,
	   rawData:myRawData
	  };
	 }
	 for (var row, i = -1; row = result[++i];){
	  if(row.fldcontextrawID!=curIndex){
	     
	   saveData(rawData);
	   curIndex=row.fldcontextrawID;
	   rawData=[];
	   rawDataIndex = -1;
	  }
	  rawData[++rawDataIndex] = row;
	     
	 }
	 saveData(rawData);
	 
	 for (var result, i = -1; result = results[++i];){
//		 console.log(util.inspect(result, false, null));
		 results[i].values = {};
		 results[i].API = results[i].rawData[0].fldAPI;
		 results[i].Device = results[i].rawData[0].fldDevice;
		 results[i].Session = results[i].rawData[0].fldSession;
		 results[i].Method = results[i].rawData[0].fldMethod;
		 results[i].Timestamp = results[i].rawData[0].fldTimestamp;
		 results[i].ContextObject = results[i].rawData[0].fldContextObject;

		 var parentObjType = {"0":{'type':'o','obj':results[i].values}};
		 normalizeResult(result, 0, "0", parentObjType);
		 delete(results[i].rawData);
	 }
	 
//	 console.log(util.inspect(results, false, null));
//	 console.log(util.inspect(parentObjType, false, null));
	 console.log(JSON.stringify(results));
	 
	}
function normalizeResult(result, index, parentObjRef, parentObjType) {
	while (result.rawData[index] != undefined){
		var row = result.rawData[index];
		parentObjRef = (row.ObjectRef=="0")?"0":row.ObjectRef.substring(0,row.ObjectRef.lastIndexOf(".")+1);
		var parent = parentObjType[parentObjRef];
//		console.log("parentObjRef: "+parentObjRef);
//		console.log(index+"\t"+parentObjRef+"\t"+row.ObjectRef+"\t"+row.fldValueType+"\t"+row.fldValueName + "\t" + row.fldValue);
		index++;
		
		var parentIndex = null;
		if (row.fldValueType=='array'){
			parentObjRef = row.fldValue;
//console.log("this ObjRef: "+parentObjRef);
			if (row.fldValueName == "") row.fldValueName = row.fldDescription;
			row.fldValue = [];
			var parObj;
			switch (parent.type){
			case 'o':
				parObj = parent.obj;
				break;
			case 'a':
				var _i = row.ObjectRef.substring(row.ObjectRef.lastIndexOf(".")+1);
				if (parent.obj.length==_i)
					parent.obj[_i] = {};
				parObj = parent.obj[_i];
				break;
			}
			parObj[row.fldValueName] = row.fldValue;
			parentObjType[parentObjRef]={'type':'a','obj':parObj[row.fldValueName],'index':0};
		}else{
			var parObj;
			switch (parent.type){
			case 'o':
				parObj = parent.obj;
				break;
			case 'a':
				var _i = row.ObjectRef.substring(row.ObjectRef.lastIndexOf(".")+1);
				if (parent.obj.length==_i)
					parent.obj[_i] = {};
				parObj = parent.obj[_i];
				break;
			}
			parObj[row.fldValueName] = row.fldValue;
		}
		
		index = normalizeResult(result, index, parentObjRef, parentObjType);
	}
	return index;
}
