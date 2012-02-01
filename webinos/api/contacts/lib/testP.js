//The code to inject webinos dependencies into the code:

console.log("DBG dirname",__dirname);
var path = require('path');

var deps = require('../dependencies.json');
console.log("DBG deps.resolve",path.resolve(__dirname, '../dependencies.json'))//path.resolve(__dirname, deps.root.location))
//var moduleRoot = require(path.resolve(__dirname, deps.root.location));

var moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
console.log("DBG moduleRoot",moduleRoot);

var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
console.log("DBG dependencies",dependencies);
var webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location);
//Requiring files can then be done by using e.g.
console.log("DBG webinosRoot",webinosRoot);



//var rpc = require(path.join(webinosRoot, dependencies.rpc.location, "lib/rpc.js"));
////or if the package.json file is defined correctly (untested)

//var rpc2 = require(path.join(webinosRoot, dependencies.rpc.location));
//console.log("DBG rpc",rpc);
//console.log("DBG rpc2",rpc2);
