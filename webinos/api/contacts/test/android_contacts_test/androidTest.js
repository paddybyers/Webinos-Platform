var util = require('util');
var contacts = require('bridge').load('org.webinos.impl.ContactManagerImpl', this);

console.log("javaBridge loaded Exposed methods: ");
for(var i in contacts)
	console.log(i + ': ' + contacts[i]);

var opt = new Array();

var fields = {};

fields["name"] = "Paolo";
//fields["name"] = "Darth - Vader, Jr.";
fields["phoneNumber"] = "+460123456789";
fields["nickname"] = "Darthy";
//fields["organization"] = "Empire ORG.";
//fields["email"] = "darth@empire.net";
fields["email"] = "vergori@ismb.it";
//fields["address"] = "Empire";
//fields["im"] = "darth.vader";
//fields["url"] = "www.empire.org";


function successCB(tmp)
{	
	for(var i=0;i<tmp.length;i++) {
		console.log(util.inspect(tmp[i].name));
	}
}

	
contacts.find(fields, successCB, function(){}, opt);


