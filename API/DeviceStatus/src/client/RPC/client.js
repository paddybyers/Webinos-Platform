var devicestatusservice;

$(document).ready(
	function () {
		
		$('#findService').click(
			function () {
				webinos.ServiceDiscovery.findServices(
					new ServiceType("http://wacapps.net/api/devicestatus"),
					{onFound: function (service) { devicestatusservice = service; } }
				);
			}
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
