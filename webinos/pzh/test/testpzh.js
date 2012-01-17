var path = require('path');
var Pzh = path.resolve(__dirname, '../lib/pzh_sessionHandling.js');
var connectPzh = path.resolve(__dirname, '../lib/pzh_connecting.js');

var WebSocket = path.resolve(__dirname,'../lib/pzh_websocket.js');
var webinosDemo = path.resolve(__dirname, '../../../demo');

var ipAddr = 'localhost', port = 8000, serverPort = 8083, webServerPort = 8082;
var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=WebinosPzh\nemail=internal@webinos.org\ndays=180\n" ;

var pzhModules = [
    {name: "get42", params: [99]}
];

describe("start pzh", function() {
	it("start websocket server", function() {
	    WebSocket.startServer(ipAddr, serverPort, webServerPort, pzhModules, function(result) {
			expect(result).not.toBeNull();
		    expect(result).not.toEqual(false);
		    expect(result).toEqual(true);
		    expect(result).toContain(RSA_START);
		    expect(result).toContain(RSA_END);
		});
     });
     
    it("start pzh", function() {
    	Pzh.startPzh(contents, ipAddr, port, function(result, pzh) {
			if (result === "startedPzh") {
				console.log('=== PZH STARTED ===');			
				pzh = pzh;
			}
		});
	});
	
	it("connect other pzh", function() {
		connectPzh.downloadCertificate(pzh, ipaddr, serverPort, function(result) {	
	});
	
	ConnectPzh.downloadCertificate(pzh, ipaddr, serverPort, function(result) {
				if(result === "downloadedSuccessfully") {
					Helper.connectedPzhPzp(pzh);
					Helper.addPzpQR(pzh);
					Helper.crashLog(pzh);
					var pzhRoot = webinosDemo+'/certificates/pzh';
					var pzhName = pzhRoot+'/'+pzh.sessionId;
					var	pzhCertDir = path.resolve(__dirname, pzhName+'/cert'),
					var pzhKeyDir = path.resolve(__dirname, pzhName+'/keys'),
					var pzhSignedCertDir = path.resolve(__dirname, pzhName+'/signed_cert'),
					var	pzhRevokedCertDir = path.resolve(__dirname, pzhName+'/signed_cert/revoked');;

					Revoker.listAllPzps(pzhRevokedCertDir);
					Revoker.listAllPzps(pzhSignedCertDir);
					Revoker.revokePzp('WebinosPzp', pzh, pzh.config.pzhCertDir, pzh.config.pzhSignedCertDir, pzh.config.pzhKeyDir, pzh.config.pzhRevokedCertDir);				
					Pzh.restartPzh(pzh);
				} else {
					console.log("Failed downloading certificate");
				}
			});
		} else {
			console.log("Failed starting PZH");
		}		
		
	});
});



	
		
