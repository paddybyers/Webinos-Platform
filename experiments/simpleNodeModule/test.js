console.log(__dirname + "/build/default/helloworld.node");
var helloWorld = require(__dirname + "/build/default/helloworld.node");
tester = new helloWorld.HelloWorld();
console.log("Test");
console.log(tester.hello());
