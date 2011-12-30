var devicestatusservice;

$(document).ready(
	function () {

		function loadAspects () {
			for (var aspect in vocabulary) {
				successCB = function(res) {
					if (res.isSupported) {
						aspects_list.options[aspects_list.options.length] = new Option(res.aspect);
					}
				};
				devicestatusservice.isSupported(aspect, null, successCB);
			}
		}
		
		function loadComponents(components) {
			components_list.options[components_list.options.length] = new Option(components);
		}

		function loadProperties(aspect) {
			for (var propertyIndex in vocabulary[aspect].Properties) {
				property = vocabulary[aspect].Properties[propertyIndex];
				successCB = function(res) {
					if (res.isSupported) {
						properties_list.options[properties_list.options.length] = new Option(res.property);
					}
				};
				devicestatusservice.isSupported(aspect, property, successCB);
			}
		}

		$('#findService').click(
			function () {
				var address = $('#pzh_pzp_list').val();

				webinos.ServiceDiscovery.findServices(
					new ServiceType("http://wacapps.net/api/devicestatus"),
					{onFound:
						function (service) { 
							devicestatusservice = service;
						} }
				);
			}
		);

		$('#bindService').click(
			function () {
				devicestatusservice.bindService(
					{onBind:
						function (service) {
							loadAspects();
						} }
				);
			}
		);

		$('#getComponents').click(
			function () {
				aspect = $('#aspects_list').val();
				loadProperties(aspect);

				successCB = function (value) { loadComponents(value); };
				errorCB = function (value) { alert("Error: " + value); };
				devicestatusservice.getComponents(aspect, successCB, errorCB);
			}
		);

		$('#getPropertyValue').click(
			function () {
		
				var prop = {component: $('#components_list').val(), aspect: $('#aspects_list').val(), property: $('#properties_list').val()},
				successCB = function (value) { alert("Success => " + prop.property + ": " + value ); };
				errorCB = function (value) { alert("Error: " + value); };
				devicestatusservice.getPropertyValue(successCB, errorCB, prop);
			}
		);

		$('#aspects_list').change(
			function () {
				$('#components_list').empty();
				$('#properties_list').empty();
			}
		);

	}
);
