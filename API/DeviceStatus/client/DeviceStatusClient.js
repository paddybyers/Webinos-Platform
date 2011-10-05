    $(document).ready(function() {
            	    var devicestatus = null;
            	    
                    $('#findService').bind('click', function() {
                	    webinos.ServiceDiscovery.findServices("DeviceStatus", {onFound: function (service) {
                	    	test = service;
                	    }});
                    });
                    
                    $('#propertyValue').bind('click', function() {
                    	devicestatus.getPropertyValue(
				function (result){ alert(result);},
				function(error)  { alert(error); },
				"prop"
				);
                    }); 
                    
            });
 
