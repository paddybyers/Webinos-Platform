var centerPoint = new google.maps.LatLng(48.1794411, 11.529219399999988);
var markerPoint = new google.maps.LatLng(48.1794411, 11.529219399999988);
var marker;
var position;
var map;
var geocoder;

var allServices = {};
var vehicle;

var geolocation;
var ps;

function initializeMap() {
    var mapOptions = {
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: centerPoint,
      scaleControl: false,
      streetViewControl: false,
      navigationControl: false,
      mapTypeControl: false
      
    };

    map = new google.maps.Map(document.getElementById("map"),
            mapOptions);
    geocoder = new google.maps.Geocoder();
    marker = new google.maps.Marker({
      map:map,
      animation: google.maps.Animation.DROP,
      position: markerPoint
    });
}

function updateStatus(text){
	$('#loadingstatus').html(text);
}

	


				function logMessage(msg) {
                                	if (msg) {
	                                    $('#message').append('<li>' + msg + '</li>');
                                	}
                                }


						$(document).ready(function() {
								$(window).bind('hashchange', function() {
  										switch(window.location.hash){
  											case '#travel':
  												break;
  											default:
  												alert(window.location.hash);
  												break;
  										}
								});
						
						
  								initializeMap();
  
                                function fillPZAddrs(data) {
                                    var pzpId = data.from;
                                    var pzhId, connectedPzh , connectedPzp;
                                    if (pzpId !== "virgin_pzp") {
                                      pzhId = data.payload.message.pzhId;                                     
                                      connectedPzp = data.payload.message.connectedPzp; // all connected pzp
                                      connectedPzh = data.payload.message.connectedPzh; // all connected pzh
                                      updateStatus('2: Application registered');
                                      	findVehicle();
										
                                    }
                                }
                                webinos.session.addListener('registeredBrowser', fillPZAddrs);
                                
                                function updatePZAddrs(data) {
                                    if(typeof data.payload.message.pzp !== "undefined") {
                                        logMessage('new pzp ' + data.payload.message.pzp);
                                    } else {
                                        logMessage('new pzh ' + data.payload.message.pzh);
                                    }
                                }
                                webinos.session.addListener('update', updatePZAddrs);
                   				
                   				
                   
                                function printInfo(data) {
                                	logMessage(data.payload.message);
                                }
                                webinos.session.addListener('info', printInfo);
								
				$('#registerBrowser').bind('click', function() {
                                
                });
				
                $('#findService').bind('click', function() {
                		allServices = {};
                		vehicle = null;
                		$('#vehicles').empty();
                		
                        webinos.ServiceDiscovery.findServices( 
                        new ServiceType('http://webinos.org/api/vehicle'),                         
                        {onFound: function (service) {
                            vehicle = service;
                            allServices[service.serviceAddress] = service;
                            $('#vehicles').append($('<option>' + service.serviceAddress + '</option>'));
                    		
                    }});
                });
                
 			$('#bind').bind('click', function() {
                	//vehicle = allServices[$('#vehicles').attr('recent')];
                	//console.log(allServices);
                	vehicle.bindService({onBind:function(service) {
                        logMessage('API ' + service.api + ' bound.');
                    }});
                });
            $('#getGear').bind('click', function(){
            	vehicle.get('shift', handleGear, handleError);
            });
 
		startUp();
		
		
		function startUp(){
			updateStatus('Registering application at PZP');
			var options = {type: 'prop', payload: {status:'registerBrowser'}};
            webinos.session.message_send(options);
		}
		
		function findVehicle(){
			updateStatus('Looking for vehicle data provider');
			                		allServices = {};
                		vehicle = null;
                		$('#vehicles').empty();
                		
                        webinos.ServiceDiscovery.findServices( 
                        new ServiceType('http://webinos.org/api/vehicle'),                         
                        {onFound: function (service) {
                            updateStatus('Vehicle found');
                            vehicle = service;
            				bindToVehicle();        		
                    }});
		}
		
		
		function findGeolocation(){
				updateStatus('Looking for a geolocation provider');
			            allServices = {};
                		geolocation = null;
                		
                		webinos.ServiceDiscovery.findServices( 
                        new ServiceType('http://www.w3.org/ns/api-perms/geolocation'),                         
                        {onFound: function (service) {
                            updateStatus('geolocation service found');
                            geolocation = service;
            				bindToGeolocation();        		
                    }});
		}
		
		function bindToVehicle(){
			updateStatus('Binding to Vehicle');
			vehicle.bindService({onBind:function(service) {
						updateStatus('Bound to Vehicle');
                        logMessage('API ' + service.api + ' bound.');
            			registerVehicleListeners()
            }});
		}
		
		function bindToGeolocation(){
			updateStatus('Binding to Geolocation');
			geolocation.bindService({onBind:function(service) {
						updateStatus('Bound to Geolocation service');
                        logMessage('API ' + service.api + ' bound.');
            			registerGeoListener()
            }});
		}
		
		function registerVehicleListeners(){
			updateStatus('Adding Listener Vehicle API');
			vehicle.addEventListener('shift', handleGear, false);
			updateStatus('Listener registered.');
			findGeolocation();
		}
		
		function registerGeoListener(){
			var params = {};
			ps = geolocation.watchPosition(handlePosition,errorCB, params);
		}
		
	
});


function errorCB(error){
	logMessage('error', "ERROR:" + error.message);
	console.log('error' + error.message);
}


function handleGear(data){
	$('#v-gear').html(data.gear)
}

function handlePosition(data){
	//logMessage(data.coords.latitude + ' - ' + data.coords.longitude);
	var uPos = new google.maps.LatLng(data.coords.latitude, data.coords.longitude);
	marker.setPosition(uPos);
	map.setCenter(uPos);

	$('#v-speed').html(data.coords.speed);
	
}

function handleError(error){
	//logMessage(error)
}