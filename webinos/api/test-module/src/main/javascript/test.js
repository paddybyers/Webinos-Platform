var fs = require('fs');

var root = JSON.parse(fs.readFileSync('../../../dependencies.json'));
console.log('root: ' + root.root.location);

var dependencies = JSON.parse(fs.readFileSync('../../../' + root.root.location + '/dependencies.json'));
console.log('dependencies attestation: ' + dependencies.api.test.location);
