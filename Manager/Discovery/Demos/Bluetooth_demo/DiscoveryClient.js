//ziran.sun@samsung.com

var serviceType;
var findHandle = 0;
var bindHandle = 0;

// Callback method that does next step function once the device with specific services are found - e.g. start 
// binding with the new service 
function serviceFoundCB(serviceType) 
{
}

// Callback once the service is not found etc. 
function serviceLostCB(service)
{	
}

function Client()
{
  this.socket = 0;
	
  this.connect = function()
  {
    this.socket = io.connect('http://localhost:8000');
		
	console.log(serviceType);	
	
	//Pass serviceType to node.js in Json format
	this.socket.emit('findservice', { serviceType: serviceType });
	    
	this.socket.on('Discovery-plugin', function () {
	    
	var webinos  = new Webinos();
	
	console.log("start discovery");
	console.log(serviceType);
	
	//call discovery interface
	findHandle = window.webinos.localdiscovery.findServices(serviceType, {onFound:serviceFoundCB, onLost:serviceLostCB});
		
	});
		        			
	return false;
  }

 return this;
}	

function changeHandler(event)
{
  //var index, newValue;
  var index;

  // Get the current index
  index = this.selectedIndex;

  if (index >= 0 && this.options.length > index)
  {
  // Get the new value
  serviceType = this.options[index].value;
 }
 
 return serviceType;

}

var selectlist = document.getElementById('servicelist');

if (servicelist.addEventListener) 
{
  // DOM2 standard
  servicelist.addEventListener("change", changeHandler, false);
}
else if (servicelist.attachEvent) 
{
  // IE fallback
  servicelist.attachEvent("onchange", changeHandler);
}
else 
{
  // DOM0 fallback
  servicelist.onchange = changeHandler;
}
