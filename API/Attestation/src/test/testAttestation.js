/*
 * This isn't a proper test.
 */
var attester = require('../main/attestation.js');

var nonce = [0x00, 0x01, 0x02, 0x03, 0x04,
             0x00, 0x01, 0x02, 0x03, 0x04,
             0x00, 0x01, 0x02, 0x03, 0x04,
             0x00, 0x01, 0x02, 0x03, 0x04];

var pcrs = [1,2,3];

attester.getAttestationKey("4", function(key) {

	console.log("Got key: " + key["id"]);
	console.log(key);
	
	
	attester.getAttestation(key["id"], pcrs, nonce, 
			function(schema, softwareList, pcrList, attData) {
		
		console.log("Got attestation: " + schema);
		console.log("Software list: \n" + softwareList);
		console.log("PCRS: \n" + pcrList);
		console.log("Quote: " + attData);
		
	});
	
});
