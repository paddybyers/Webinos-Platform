$(document).ready(
	function () {
		var devicestatusservice;
		
		webinos.ServiceDiscovery.findServices(
			"DeviceStatusManager",
			{onFound: function (service) { devicestatusservice = service; } }
		);
		
		$('#getProp').click(
			function () {
				var prop = {component: "component_value", aspect: "aspect_value", property: "property_value"},
				successCB = function (value) { alert(value); };

				devicestatusservice.getPropertyValue(prop, successCB, null);
			}
		);
	}
);
