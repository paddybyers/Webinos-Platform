var devicestatusservice;

$(document).ready(
	function () {
		
		$('#findService').click(
			function () {
				var address = $('#pzh_pzp_list').val();
				webinos.ServiceDiscovery.findServices(
					address,
					new ServiceType("http://wacapps.net/api/devicestatus"),
					{onFound: function (service) { devicestatusservice = service; } }
				);
			}
		);

		$('#getBattery').click(
			function () {
		
				var prop = {component: "_default", aspect: "Battery", property: "batteryLevel"},
				successCB = function (value) { alert("Success => BatteryLevel (%): " + value ); };
				errorCB = function (value) { alert("Error: " + value); };

				devicestatusservice.getPropertyValue(successCB, errorCB, prop);
			}
		);

	}
);
