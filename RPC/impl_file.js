var fs = require('fs');

exports = module.exports = createFileReader;
exports.createFileReader = createFileReader;
exports.createFileSaver = createFileSaver;
exports.createFileWriter = createFileWriter;
exports.createBlob = createBlob;
exports.createFile = createFile;

	function createBlob () {
		return new Blob();
	} ;

	var Blob = function () {
	
	
	};
    
	
	
    Blob.prototype.size = 0;
    Blob.prototype.type = "";
    
    Blob.prototype.__start = 0;
    Blob.prototype.__end = -1;
    
    //slice Blob into byte-ranged chunks
    
    Blob.prototype.slice = function (start, end, contentType) {
    	temp = new Blob();
    	temp.__start = start;
    	temp.__end = end;
    	if (contentType) temp.type = contentType;
    	return temp;
  	};
  	
	function createFile (name, date) {
		temp = new File();
		temp.name = name;
		if (typeof date === 'undefined') temp.date = null;
			else temp.date = date;
		
		//read file size and content type
		
		stat = fs.statSync(name);
		temp.size = stat.size;

		return temp;
		
		
	} ;

	var File = function () {
		
		
	};
	File.prototype.name = null;
	File.prototype.date = null;
	File.prototype = Blob.prototype;
	
	
	function createFileSaver () {
		return new FileSaver();
	};
	
	var FileSaver = function () {
	
		
	};
	
	FileSaver.prototype.saveAs = function (blob, name){
		
		var inner = new WebinosFileSaver();
		
		if (typeof inner.onwritestart !== 'undefined' && inner.onwritestart != null){
			inner.onwritestart();
		}
		inner.readyState = inner.WRITING;
		fs.writeFile(name, blob.__dataAsString, function(err) {
			inner.readyState = inner.DONE;
			if(err) {
		    	console.log(err);
				if (typeof inner.onerror !== 'undefined' && inner.onerror != null){
					inner.onerror();
				}
				inner.error = err;
		    } else {
				if (typeof inner.onwriteend !== 'undefined' && inner.onwriteend != null){
					inner.onwriteend();
				}
		    }
		}); 

		return inner;
	}
	
	var WebinosFileSaver = function () {
	
		
	};
	
	WebinosFileSaver.prototype.abort = function () {
    	//raises (FileException);
    }
    WebinosFileSaver.prototype.INIT = 0;
    WebinosFileSaver.prototype.WRITING = 1;
    WebinosFileSaver.prototype.DONE = 2;
    
    WebinosFileSaver.prototype.readyState = 0;
    
    WebinosFileSaver.prototype.error = null;
    
    WebinosFileSaver.prototype.onwritestart = null;
    WebinosFileSaver.prototype.onprogress = null;
    WebinosFileSaver.prototype.onwrite = null;
    WebinosFileSaver.prototype.onabort = null;
    WebinosFileSaver.prototype.onerror = null;
    WebinosFileSaver.prototype.onwriteend = null;
	
    
    
    function createFileWriter () {
		return new FileWriter();
	};
	
	var FileWriter = function () {
	
		
	};
    
	FileWriter.prototype.writeAs = function (name){
		var writer = new WebinosFileWriter();
		writer.fileName = name;
		
		
		return writer;
	}
    
	var WebinosFileWriter = function () {
	
		
	};
    
	WebinosFileWriter.prototype =  WebinosFileSaver.prototype;
	
	WebinosFileWriter.prototype.length = 0;
	WebinosFileWriter.prototype.position = 0;
	
	WebinosFileWriter.prototype.seek = 0;
	
	WebinosFileWriter.prototype.write = function (blob) {
		if (typeof this.onwriteend !== 'undefined' && this.onwriteend != null){
			this.onwritestart();
			this.readyState = this.WRITING;
		}
		
		var log = fs.createWriteStream(this.fileName, {'flags': 'a'});
		
		if (typeof this.onwriteend !== 'undefined' && this.onwriteend != null){
			this.onwrite();
			this.readyState = this.WRITING;
		}
		// use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
		
		//TODO: start writing not at the end of file but at this.seek
		log.write(blob.__dataAsString);
		log.end();
		
		if (typeof this.onwriteend !== 'undefined' && this.onwriteend != null){
			this.onwriteend();
			this.readyState = this.DONE;
		}
	}
	
	WebinosFileWriter.prototype.seek = function (offset) {
		
		if (this.readyState == this.WRITING){
			throw ("INVALID_STATE_ERR");
		}
		
		if (offset > this.length){
			this.seek = this.length;
		}
		else{
			if (offset < 0){
				offset = offset + this.length;
				if (offset < 0) this.seek = 0;
				else this.seek = offset;
			}
		}
	}
	
	WebinosFileWriter.prototype.truncate = function (length) {
		length = parseInt(length);

		if (isNaN(length)){
			console.log("Truncate Error: Input argument is not a number: " + length + " is " + typeof length);
			
			error = {};
			error.target = { };
			error.target.error = { };
			error.target.error.name = "INVALID_ARGUMENT_ERR";
			error.target.error.code = 1;
			
			this.onerror(error);
			return;
		}
		
		console.log("Starting Truncate");
		
		this.readyState = this.WRITING;
		this.onwritestart();
		var self = this;
		
		fs.open(this.fileName, 'r+', '0666', function (err, fd) {
			if (typeof fd !== 'undefined'){
				
				self.onwrite();
				self.readyState = self.WRITING;
				
				//async not working in windows build
				//fs.truncate(fd, length, function () {
					fs.truncateSync(fd, length);
					fs.close(fd);
					self.onwriteend();
					self.readyState = self.DONE;
				//})
			}
			else{
				console.log("Truncate Error: " + err.message);
				error = {};
				error.target = { };
				error.target.error = { };
				error.target.error.name = "NOT_FOUND_ERR";
				error.target.error.code = 8;
				
				self.onerror(error);
			}
		});
	}
	
    
    
	function createFileReader () {
		return new FileReader();
	};

	

	var FileReader = function () {
	
		
	};

	//async read methods
	FileReader.prototype.readAsArrayBuffer = function (blob) {
		//throws new OperationNotAllowedException();
		console.log('Should Read something as array buffer');
	};

	FileReader.prototype.readAsBinaryString = function (blob) {
		//throws new OperationNotAllowedException();
		console.log('Should Read something as binary string');
	};

	FileReader.prototype.readAsText = function (blob, encoding) {
		//throws new OperationNotAllowedException();
		console.log('Should Read something as text from blob: ' + blob.name + " " + blob.date);
		var self = this;
		fs.readFile(blob.name, function(err, data) {
			  //console.log(data);
			  //console.log(err);
			  if (err){
				  error = {};
				  error.target = { };
				  error.target.error = { };
				  error.target.error.name = "NOT_READABLE_ERR";
				  error.target.error.code = 4;
				  self.onerror(error);
			  }
			  else{
			  	evt = {};
			  	evt.target = { };
			  	evt.target.result = data;
			  	self.onload(evt);
			  }
		});

	};

	FileReader.prototype.readAsDataURL = function (blob) {
		//throws new OperationNotAllowedException();
		console.log('Should Read something as data url');
	};

	FileReader.prototype.abort = function () {
		console.log('Should abort');
	};

	FileReader.prototype.EMPTY = 0;
	FileReader.prototype.LOADING = 1;
	FileReader.prototype.DONE = 2;

	FileReader.prototype.readyState = null;

	FileReader.prototype.error = null;

	FileReader.prototype.onloadstart = null;
	FileReader.prototype.onprogress = null;
	FileReader.prototype.onload = null;
	FileReader.prototype.onabort = null;
	FileReader.prototype.onerror = null;
	FileReader.prototype.onloadend = null;

