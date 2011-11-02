if (typeof webinos === 'undefined')
		webinos = {};

webinos.rpc = {};

socket = io.connect('http://localhost:8000');

function emptyList( box ) {
	box.options.length = 1;
}

function fillList( box, arr0, arr1 ) {
	// arr[0] holds the display text
	// arr[1] are the values

	for ( i = 0; i < arr0.length; i++ ) {

		option = new Option( arr0[i], arr1[i] );
		box.options[box.length] = option;
	}

	// Preselect option 0
	box.selectedIndex=0;
}

webinos.rpc.findServices = function (serviceType) {
	
	socket.emit('findservice', serviceType );
	
	socket.on('response', function (results){
		document.getElementById("loader").innerHTML = "";
		var textarray = [];
		var valuearray = []; 
		var temp = [];
		console.log("results:" + results);
	
		var str = String(results);
		var str_split = str.split("\n");
				
		var val = document.getElementById('devicelist');
		emptyList(devicelist);
		
		for (i = 0; i < str_split.length; i++)
		{	
			if(str_split[i].indexOf(",", 0) == 0)
			{
				// remove comma in the beginning
				str_split[i] = str_split[i].substring(1, str_split[i].length);
			}
			textarray.push(str_split[i]);
			valuearray.push(str_split[i]);
		}
		fillList(devicelist, textarray, valuearray);
	});
}

webinos.rpc.bindsevice = function (device) {
	console.log("device:" + device);
	socket.emit('binddevice', device );
	
	socket.on('folder-response', function (results){
		document.getElementById("loader").innerHTML = "";
		console.log("folder-response results:" + results);
		var textarray = [];
		var valuearray = []; 
		
		var str = String(results);
		var folder_arr = str.split(",");
		var occurences = (str.split(",").length - 1);
		
		var val = document.getElementById('folderlist');
		emptyList(folderlist);
		
		for(var i = 0; i <= occurences; i++)	
		{
			textarray.push(folder_arr[i]);
			valuearray.push(folder_arr[i]);
		}
		
		fillList(folderlist, textarray, valuearray);
		
	});
}

getfilelist = function(data){
	socket.emit('listfile', data);
	socket.on('listresp', function (results){
		document.getElementById("loader").innerHTML = "";
		console.log("filelist", results);
		
		var textarray = [];
		var valuearray = []; 
		
		//handle results
		var substr = String(results);
		
		var occurences = (substr.split("file name").length - 1);
		console.log("occurences:" + occurences);
		
		var data = substr.split("file name=");
		
		var val = document.getElementById('filelist');
		emptyList(filelist);
		
		for(var i = 1; i <= occurences; i++)	
		{
			var endpoint = data[i].indexOf(" ");
			data[i] = data[i].substring(0, endpoint);
			//remove ""
			data[i] = data[i].substring(1, data[i].length -1);
			
			textarray.push(data[i]);
			valuearray.push(data[i]);
		}
		
		fillList(filelist, textarray, valuearray);
		// end of result handling
	});
}

transferfile = function(filename){
	socket.emit('transferfile', filename);
	socket.on('transfer-rep', function (){
		document.getElementById("loader").innerHTML = "";
	});
	
}
