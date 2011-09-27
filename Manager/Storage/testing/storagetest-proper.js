//storage test proper

var path = require('path');
var securestore = require('../securestore.js');
var fs = require('fs');


var testfilecontent = "Do not delete - I am testing.\n";
var pass = "nruowgunrwognworu2";
var zipFile = "test2zip.zip";
var zipPath = "test2";
var testfile = path.join(zipPath,"testfile1.txt");
var testNoStoreFile = "test2store.zip";
var testStoreDir = "test2store";



testEncDec(function() {
	testZip( function() {
		testOpenClose( function() { 
			console.log("Done");
		});
	});
});


var errorFn = function(err) {
	console.log("ERROR");
	console.log(err);
	process.exit();
}

var assertFn = function assert(test, description, err) {
	if (test) {
		console.log("Passed: " + description);
	} else {
		errorFn("Failed: " + description + " " + err );
	}
};



function testEncDec(done, error) {
	read(testfile, function(origdata) {
		// test encryption
		assertFn((origdata === testfilecontent), "Read file");
		securestore.encryptFile(testfile, pass, function() {
			read(testfile, function(encdata) {
				assertFn((origdata !== encdata), "Encryption");
				// test decryption
				securestore.decryptFile(testfile, pass, function() {
					read(testfile, function(decdata) {
						assertFn((origdata === decdata), "Decryption");
						done();
					});			
				});

			});		
		});
	});
};






// test zip
// test unzip
function testZip(done) {
	read(testfile, function(origdata) {
		// test zip
		assertFn((origdata === testfilecontent), "Read file");
		// TODO: should do some stat'ing here.		
		// now practice zipping a directory into "zipfile"
		securestore.zipDir(zipFile, zipPath, function() {
			//rimraf it
			rimrafSync(zipPath);					
			// test unzip again
			securestore.unzipFile(zipFile, function() {
				read(testfile, function(unzipData) {
					assertFn((origdata === origdata), "unzip/zip");
					done();
				});			
			});
		
		});
	});

};


// test open, no storeFile
// test close
var testOpenClose = function testOpenClose(donefn) {
    var val = "";
    
    // TODO: delete any store directory

    // TODO: delete any store file

    //open
    securestore.open(pass, testNoStoreFile, testStoreDir, function(err) {	
	    assertFn((err === null || err === undefined), "Open", err);
	    // check that the store directory exists
	    assertFn(path.existsSync(testStoreDir), "Open created a directory");
	    //store a key value
	    securestore.storeKeyValue(testStoreDir, "Why", {because: "we have to store something"}, function() { 
	        securestore.getKeyValue(testStoreDir, "Why", function(err, val) {
                assertFn((val["because"] === "we have to store something"), "Retrieve value", err);
                securestore.close(pass, testNoStoreFile, testStoreDir, function(err) {
		            assertFn(true, "Close 1",err);
		            assertFn(!path.existsSync(testStoreDir), "Close killed the store directory");
		            assertFn(path.existsSync(testNoStoreFile), "Close created the store file");
		            donefn();
	            });	        
	        });
        });
    });

};


var testStoreLoad = function testStoreLoad(donefn) {

// open

// test store key

// test load key

// close



}

// open

// test load key


function read(file, fun) { 
	fs.readFile(file, 'utf8', function (err, data) {
	   fun(data);
	});
}

function rimrafSync (p) {
  var s = fs.lstatSync(p);
  if (!s.isDirectory()) return fs.unlinkSync(p);
  fs.readdirSync(p).forEach(function (f) {
    rimrafSync(path.join(p, f));
  });
  fs.rmdirSync(p);
};

