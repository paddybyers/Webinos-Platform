addEventListener("load", function() { setTimeout(hideURLbar, 0); }, false);
function hideURLbar(){
window.scrollTo(0,1);
}

$(function() {
if ($("ul.tabs")) $("ul.tabs").tabs("div.tabbed", {effect: 'ajax'});
});

$(function() { 
if ($(".accordion")) $(".accordion").tabs(".accordion dd", {tabs: 'dt', effect: 'slide', initialIndex: null});
});
var tvService =null;
var channelMap = {};
$(function(){setTimeout(getServices,500);});

function getServices(){
  webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/tv'), {onFound: function (service) {
		  tvService = service;
		  tvService.tuner.getTVSources(/*TVSuccessCB*/ function(sources){
		   var markup = "";
		   jQuery.each( sources, function(indexInArray, source){
		     markup +="<dt>"+ source.name + "</dt><dd>";
		     jQuery.each( source.channelList, function(idxchn, channel){
			markup += "<p><input name='"+source.name+'_'+channel.name+"' class='channelButton' type='button' value='"+ channel.name + "'/></p>";
		        channelMap[source.name+'_'+channel.name] = channel;
		     });
		     markup +="</dd>";
		   }); 
		   if (markup != "") markup = "<dl class='accordion'>" + markup + "</dl>";
		   $("#content").html(markup);
		   if ($(".accordion"))
		      $(".accordion").tabs(".accordion dd", {tabs: 'dt', effect: 'slide', initialIndex: null});
		   if ($(".channelButton")){
		     $(".channelButton").click(function (e) {
			tvService.display.setChannel(channelMap[e.currentTarget.name],function(){$('#status').text("Channel changed to " + e.currentTarget.name); },function(){});
		     });
		   }
		  }
		  );
	    }});
  
}

$(document).ready(function() {
if ($("#browsable")) $("#browsable").scrollable().navigator();	
});