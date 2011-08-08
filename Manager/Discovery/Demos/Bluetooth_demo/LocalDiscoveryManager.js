var Webinos = function () {
};

var LocalDiscovery = function ()
{
  var serviceType = 0 ;
  
  var service = {};

  this._create_plugin = function ()
  {
    var embed = document.createElement("embed");
    embed.setAttribute("id", "plugin");
    embed.setAttribute("width", "0");
    embed.setAttribute("height", "0");
    embed.setAttribute("type", "application/x-webinos-plugin");
    document.body.appendChild(embed);
  }
  
  this._clear = function ()
  {
    document.getElementById("bluetooth").innerHTML = "";
  }
  
  this._scan = function (serviceType)
  {
    this._clear();
    plugin = document.getElementById("plugin");
    plugin.scan_bluetooth(this, serviceType);
  }

   // takes several seconds before returning any results
  this.bluetooth = function (address, name)
  {
    var status = document.getElementById("bluetooth");
    status.innerHTML += name + ", " + address + " " +"\n";
   
  }
  
  this._findBTServices = function (serviceType, findCallBack)
  {
    this._create_plugin();
    setTimeout(function () { webinos.localdiscovery._scan(serviceType); }, 0);
    findCallBack.onFound(service);
  }
  
  this._bindBTServices = function (service, bindCallBack)
  {
    // this._bind(service);
    
    //bindCallBack.onBind(serviceType);
    
  }
 
};

LocalDiscovery.prototype.findServices = function (serviceType, findCallBack, options, filter) 
{
  return this._findBTServices(serviceType, findCallBack, name);
}

Webinos.prototype.localdiscovery = new LocalDiscovery();

var webinos = new Webinos();