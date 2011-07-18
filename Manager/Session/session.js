var tls = require('tls');
var fs = require('fs');

var server-options = 
{
	key: fs.readFileSync('server-key.pem'),
	cert: fs.readFileSync('server-cert.pem')
};

var client-options =
{
	key: fs.readFileSync('client-key.pem'),
	cert: fs.readFileSync('client-cert.perm'),
};

var dummy = this;
tls.createServer(server-options, function(s){
	s.write("hello");
	s.pipe(s);
}).listen(8000);

tls.connect(443, url, options, function(){
	dummy.connected(true);
});

dummy.socket.addListener('data', function(data){

});

dummy.socket.addListener('error', function(data){

});

dummy.socket.addListener('close', function(data){

});
