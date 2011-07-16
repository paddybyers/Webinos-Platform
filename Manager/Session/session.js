var tls = require('tls');
var fs = require('fs');

var options = {
key:fs.readFileSync('server-key.pem'),
cert:fs.readFileSync('server-cert.pem')
};

tls.createServer(options, function(s){
s.write("hello");
s.pipe(s);
}).listen(8000);
