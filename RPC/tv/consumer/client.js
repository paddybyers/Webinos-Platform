//execute when site loads
$(document).ready(function() {
	
	var discoveredServices = [];
	var channelMapByName = {};
	
	//check if service is present already
	var isServiceDiscovered = function(serviceName,serviceNotFoundMessage){
		if(discoveredServices[serviceName]==null && serviceNotFoundMessage){
				alert(serviceNotFoundMessage);
		}
		return discoveredServices[serviceName]!=null;
	};
	
	//find service by name and link it
	var findServiceByName = function(serviceName){
	    webinos.ServiceDiscovery.findServices(serviceName, {onFound: function (service) {
	    	if(!isServiceDiscovered(serviceName)){
    			discoveredServices[serviceName] = service;
    			log('SERVICE FOUND: '+serviceName);
	    	}else{
	    		console.log(serviceName+' already found.');
	    	}
	    }});
	};
	
	//log to UI
	var log = function(msg){
		$('#messages').prepend('<li><span class="logdate">'+(new Date())+'</span><br/>'+msg+'</li>');
	};
	
	var updateUI = function(tvSourceName, channelName){
		if(tvSourceName)
		$('#tvSourceLabel').text(tvSourceName);
		if(channelName)
		$('#channelNameLabel').text(channelName);
		
	}
	
	//register actions for all buttons
	$("#commands").delegate("button", "click", function(event){
		
		var clickedButton = event.target;
		
		switch($(clickedButton).attr('id')){
		case 'findService':
				findServiceByName('TVDisplayManager');
				findServiceByName('TVTunerManager');
			break;
		case 'getTVSources':
				if(isServiceDiscovered('TVTunerManager','TVTunerManager is not discovered yet.')){
					var successCallback = function(sources){
						//clear old sources.
						$('#channels').html('');
						channelMapByName={};
						$(sources).each(function(tvsource_ix,tvsource_el){
							$('#channels').append($('<li>TVSource.name: '+tvsource_el.name+'</li>'));
							$(tvsource_el.channelList).each(function(channel_ix,channel_el){
								$('#channels').append($('<li>'+channel_el.name+'<button id="setChannel" name="'+tvsource_el.name+channel_el.name+'">setChannel</button></li>'));
								channelMapByName[tvsource_el.name+channel_el.name]={tvsource:tvsource_el,channel:channel_el};
								log('CHANNEL FOUND: '+channel_el.name);
							});
						});
					};
					var errorCallback = function(){
						
					};
					discoveredServices['TVTunerManager'].getTVSources(/*TVSuccessCB*/ successCallback, /*optional TVErrorCB*/ errorCallback);
				}
			break;
		case 'addEventListener':
			if(isServiceDiscovered('TVDisplayManager','TVDisplayManager is not discovered yet.')){
				var channelChangeHandler = function(channel){
					log('EVENT: CHANNEL CHANGED: '+JSON.stringify(channel));
					updateUI(channel.tvsource.name,channel.name);
				};
				discoveredServices['TVDisplayManager'].addEventListener('channelchange', channelChangeHandler, false);
				
			}
			break;
		case 'setChannel':
				if(isServiceDiscovered('TVDisplayManager','TVDisplayManager is not discovered yet.')){
					
					var clickedChannel = channelMapByName[$(clickedButton).attr('name')];
					
					if(clickedChannel){
					
					var successCallback = function(channel){
						console.log('setChannel ok.');
						log('CHANNEL CHANGED: '+JSON.stringify(channel));
					};
					var errorCallback = function(){
						console.log('setChannel failed.');
					};
					discoveredServices['TVDisplayManager'].setChannel(/*Channel*/ clickedChannel.channel, /*TVDisplaySuccessCB*/ successCallback, /*TVErrorCB*/ errorCallback);
					}else{
						console.log("ERROR: channel "+$(clickedButton).attr('name')+" not found.");
					}
				}
			break;
		default:
			console.log('DEFAULT CASE: action for the button with id '+$(el).attr('id')+' not defined.');
		}
	});
});


