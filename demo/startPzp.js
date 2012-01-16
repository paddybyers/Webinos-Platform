pzp = require('../webinos/pzp/lib/pzp_sessionHandling.js');
websocket = require('../webinos/pzp/lib/pzp_websocket.js');

var ipAddr = 'localhost' , port = 8000, serverPort = 8081, webServerPort = 8080; code = "DEBUG";
process.argv.forEach(function(val, index, array) {
        if(index === 2) 
                ipAddr = val;
        else if (index === 3)
                port = val;
        else if (index === 4)
                serverPort = val;
        else if (index === 5)
                webServerPort = val;
        else if (index === 6)
            code = val;
});

var pzpModules = [
    {name: "get42", param: {}},
    {name: "file", param: {}},
    {name: "geolocation", param: {}},
    {name: "events", param: {}},
    {name: "sensors", param: {}},
    {name: "payment", param: {}},
    {name: "tv", param: {}},
    {name: "deviceorientation", param: {}},
    {name: "vehicle", param: {}},
    {name: "context", param: {}},
    {name: "authentication", param: {}},
    {name: "contacts", param: {}},
    {name: "devicestatus", param: {}}
];

if (ipAddr === '' || port <= 0) {
        console.log("Error starting Pzp.\n\t Start with: node startPzp.js <host> <port> <webServerPort> <serverPort> <CODE> \n\t E.g.: node startPzp.js localhost 8000 8080 8081 DEBUG");
} else {
        var contents ="pzh_name=localhost\ncountry=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=WebinosPzp\nemail=internal@webinos.org\ndays=180\n"
        websocket.startPzpWebSocketServer(ipAddr, serverPort, webServerPort, function() {
		    pzp.startPzp(contents, ipAddr, port, code, pzpModules, function() {
		            console.log("=== PZP started ===");
		    });
        });
}
