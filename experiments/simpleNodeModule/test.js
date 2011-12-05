console.log("Loading module from :");
console.log("> " + __dirname + "/build/default/helloworld.node");
var helloWorld = require(__dirname + "/build/default/helloworld.node");
tester = new helloWorld.HelloWorld();
console.log("Testing module:");
console.log("> " + tester.hello());
console.log("If you can read this, everything is ok");
