(function() {
	function message_send(msg) {
	
		var options = {
			port: 80,
			host: '79.125.104.149',
			method:'POST'
		};

		http.request(options, function(req, res) {		
			res.writeHead(200);
			res.write(JSON.stringify(msg));
			res.end();
	
			req.on('data', function(data) {
			console.log('received data ' + data);
				
			});
		});	
	}
}());
