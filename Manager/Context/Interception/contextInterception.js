
var interceptRPC;

interceptRPC = function(){};

logContext =function (myObj,res)
{
// Get Method Name
var method = myObj['method'];

// Get Call's parameters
var params =  myObj['params'];

// Get the result
var result = res['result'];


// Require the database class
var databasehelper = require('./../Storage/src/main/javascript/persist');

// Initialize helper classes
var pathclass = require('path');
var fsclass = require('fs');


var dbpath = pathclass.resolve('../Manager/Context/Storage/data/context.json');
console.log("MY DB PATH");

var dTime = new Date();

// Open the database
var database = new databasehelper.JSONDatabase({path: dbpath , transactional: false});

//test database
var data1 =  [{timestamp: dTime,   method: method, params:params,result:result}];


database.insert(data1);



};

interceptRPC.prototype.logContext = logContext;
exports.logContext = logContext;