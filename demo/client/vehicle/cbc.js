var centerPoint = new google.maps.LatLng(48.1794411, 11.529219399999988);
var markerPoint = new google.maps.LatLng(48.1794411, 11.529219399999988);
var marker;
var position;
var map;
var geocoder;

var allServices = {};
var recentService;


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
                		recentService = null;
                		$('#vehicles').empty();
                		
                        webinos.ServiceDiscovery.findServices( 
                        new ServiceType('http://webinos.org/api/vehicle'),                         
                        {onFound: function (service) {
                            recentService = service;
                            allServices[service.serviceAddress] = service;
                            $('#vehicles').append($('<option>' + service.serviceAddress + '</option>'));
                    		
                    }});
                });
                
 			$('#bind').bind('click', function() {
                	//recentService = allServices[$('#vehicles').attr('recent')];
                	//console.log(allServices);
                	recentService.bindService({onBind:function(service) {
                        logMessage('API ' + service.api + ' bound.');
                    }});
                });
            $('#getGear').bind('click', function(){
            	recentService.get('shift', handleGear, handleError);
            });
 
		startUp();
		
		
		function startUp(){
			updateStatus('1: Registering application at PZP');
			var options = {type: 'prop', payload: {status:'registerBrowser'}};
            webinos.session.message_send(options);
		}
		
		function findVehicle(){
			updateStatus('3: Looking for the vehicle');
			                		allServices = {};
                		recentService = null;
                		$('#vehicles').empty();
                		
                        webinos.ServiceDiscovery.findServices( 
                        new ServiceType('http://webinos.org/api/vehicle'),                         
                        {onFound: function (service) {
                            recentService = service;
                            allServices[service.serviceAddress] = service;
                            $('#vehicles').append($('<option>' + service.serviceAddress + '</option>'));
                    		
                    }});
		}
});

	


function handleGear(data){
	logMessage(data.gear);
}
function handleError(error){
	logMessage(error)
}