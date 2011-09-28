if (typeof webinos === "undefined") webinos = {};
if (typeof exports !== "undefined") session = require('../../Manager/Session/session_pzp.js');
else session = webinos.session; 

var servername = ' ', port = 0;

process.argv.forEach(function(val, index, array) {
	if(index === 2) 
		servername = val;
	if(index === 3)
		port = val;
});

if (servername === ' ' || port < 0) {
	console.log("Missing Details of server and port, enter node.js localhost 443");
} else {
	client = webinos.session.pzp.startPZP(servername, port);

	client.on('started', function() {
	// send this message to the pzh 
	var tmp = webinos.rpc.createRPC("Test", "get42", arguments);
	tmp.id = 4;
	//create a message with payload
	var options = {
  		register: false    
		  ,type: "JSONRPC"             
		  ,id:   0           
		  ,from:  client.getId() 
		  ,to:    client.getServerSession()          
		  ,resp_to:   client.getId()
		  ,timestamp:  0      
		  ,timeout:  null
		  ,payload: tmp
	}; 
	this.message = webinos.message.createMessage(options);		
	client.sendMessage(this.message);
	// send this message to another connected pzp to pzh

	var tmp1 = webinos.rpc.createRPC("Test", "get42", arguments);
	tmp1.id = 5;		
	var to = client.getOtherPZPInfo();
	//create a message with payload
	var options1 = {
	  	register: false    
		  ,type: "JSONRPC"             
		  ,id:   0           
		  ,from:  client.getId() 
		  ,to: client.getOtherPZPInfo()  
		  ,resp_to:   client.getId()
		  ,timestamp:  0      
		  ,timeout:  null
		  ,payload: tmp1
	}; 
	this.message = webinos.message.createMessage(options1);	
	client.sendMessage(this.message);

	});
}

