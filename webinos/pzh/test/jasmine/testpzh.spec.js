Pzh        = require('../../lib/pzh_sessionHandling.js');
WebSocket  = require('../../lib/pzh_websocket.js');
ConnectPzh = require('../../lib/pzh_connecting.js');
Helper     = require('../../lib/pzh_helper.js');
Revoker    = require('../../lib/pzh_revoke.js');

var ipAddr = 'localhost', port = 8000, serverPort = 8083, webServerPort = 8082;
var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=WebinosPzh\nemail=internal@webinos.org\ndays=180\n" ;

var pzhModules = [
    {name: "get42", params: [99]}
];


describe("PZH", function() {
	it("start websocket server", function() {
		WebSocket.startServer(ipAddr, serverPort, webServerPort, pzhModules, function(result) {
			expect(result).not.toBeNull();
			expect(result).not.toEqual(false);
			expect(result).toEqual(true);
		});
	});
		
	it("start PZH", function() {
		Pzh.startPzh(contents, ipAddr, port, function(result) {
			expect(result).not.toBeNull();
			expect(result).toEqual("startedPzh");			
		});
 	});
	 
	it("connected pzh and pzp list", function() {	
		Helper.connectedPzhPzp(WebSocket.instance, function(result) {
			expect(result).not.toBeNull();
		});
	});
	
	it("get crash log", function() {	
		Helper.crashLog(WebSocket.instance, function(msg) {
				expect(msg).toEqual("");
		});				
	});		
});
