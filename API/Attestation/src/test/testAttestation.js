/*
 * This isn't a proper test.
 */
var attester = require('../main/attestation.js');

var nonce = [0x00, 0x01, 0x02, 0x03, 0x04,
             0x00, 0x01, 0x02, 0x03, 0x04,
             0x00, 0x01, 0x02, 0x03, 0x04,
             0x00, 0x01, 0x02, 0x03, 0x04];

var pcrs = [1,2,3];

function printObject(o) {
  var out = '';
  for (var p in o) {
    out += p + ': ' + o[p] + '\n';
  }
  console.log(out);
}


attester.getAttestationKey("4", function(key) {
    var i=0;
	console.log("Got key: " + key["id"]);
	console.log(key);
    	
	
	attester.getAttestation(key["id"], pcrs, nonce, 
			function(schema, softwareList, pcrList, attData) {

		
		console.log("Got attestation: " + schema);
		//console.log("Software list: \n" + softwareList);

        //show every tenth entry
        console.log("Displaying every twentieth item in the log");
       
        for (i=0;i<softwareList.length;i=i+20) {
            console.log(i + " " + softwareList[i].toString());
        }
		
		console.log("PCRS: \n" + pcrList);
    
        console.log("Quote\n");
		printObject(attData.validationData);
		printObject(attData.validationData.versionInfo);
		printObject(attData.quoteInfo);
		printObject(attData.quoteInfo.versionInfo);
		
	});
	
});
