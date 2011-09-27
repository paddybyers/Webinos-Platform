
var contextAPI;

contextAPI = function(){};

function logContext (myObj,res)
{
// Get Method Name
var method = myObj['method'];

// Get Call's parameters
var params =  myObj['params'];

// Get the result
var result = res['result'];


// Require the database class
var databasehelper = require('./../../../Manager/Context/Storage/persist');

// Initialize helper classes
var pathclass = require('path');
var fsclass = require('fs');


var dbpath = pathclass.resolve('./Context/Server/data/context.json');
console.log("MY DB PATH");

var dTime = new Date();

// Open the database
var database = new databasehelper.JSONDatabase({path: dbpath , transactional: false});

//test database
var data1 =  [{timestamp: dTime,   method: method, params:params,result:result}];


database.insert(data1);



};

contextAPI.prototype.logContext = logContext;
exports.logContext = logContext;