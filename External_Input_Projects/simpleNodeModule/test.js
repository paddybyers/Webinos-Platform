console.log(__dirname + "\\HelloWorld.node");
var helloWorld = require(__dirname + "\\HelloWorld.node");
tester = new helloWorld.HelloWorld();
console.log("Test");
console.log(tester.Hello());