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
	"fldValueName = 'altitude' AND fldValue <= 1" +
//	"fldcontextrawID = '153'" +
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
	var lastContextrawID = null;
	var rowData = [];
	var rowDataIndex = -1;
	var saveData = function (myRowData){
		if (lastContextrawID == null) return;
		results[++resultsIndex] = {
			fldcontextrawID:lastContextrawID,
			data:myRowData
		};
	}
	for (var row, i = -1; row = result[++i];){
		if (row.fldcontextrawID != lastContextrawID){
			if (lastContextrawID != null) {
				saveData(rowData);
			}
			lastContextrawID = row.fldcontextrawID;
			rowData = [];
			rowDataIndex = -1;
		}
		rowData[++rowDataIndex] = row;
	}
	saveData(rowData);
	console.log(util.inspect(results, false, null));
}
