describe("DeviceStatus", 
		function()
		{
			var devicestatusManager = require("../../main/javascript/webinos.devicestatus.js").devicestatus;

			it("Gets the aspect of a property", 
				function() 
				{
					var devicestatus = devicestatusManager.devicestatus;
	
					var successCBResult,
					prop = {component: "component_value", aspect: "aspect_value", property: "property_value"},
					successCB = function (value) { successCBResult = value; };

					devicestatus.getPropertyValue(successCB, null, prop);
					
					expect(successCBResult).toEqual("foo");
				}
			);
		}
	);
