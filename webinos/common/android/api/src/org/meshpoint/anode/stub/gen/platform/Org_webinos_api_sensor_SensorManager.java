/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.platform;

public class Org_webinos_api_sensor_SensorManager {

	private static Object[] __args = new Object[3];

	public static Object[] __getArgs() { return __args; }

	static Object __invoke(org.webinos.api.sensor.SensorManager inst, int opIdx, Object[] args) {
		return inst.configureSensor(
			(org.webinos.api.sensor.ConfigureSensorOptions)args[0],
			(org.webinos.api.sensor.ConfigureSensorCB)args[1],
			(org.webinos.api.sensor.SensorErrorCB)args[2]
		);
	}

	static Object __get(org.webinos.api.sensor.SensorManager inst, int attrIdx) {
		Object result = null;
		switch(attrIdx) {
		case 0: /* maximumRange */
			result = inst.maximumRange;
			break;
		case 1: /* minDelay */
			result = inst.minDelay;
			break;
		case 2: /* vendor */
			result = inst.vendor;
			break;
		case 3: /* version */
			result = inst.version;
			break;
		default:
		}
		return result;
	}

	static void __set(org.webinos.api.sensor.SensorManager inst, int attrIdx, Object val) {
		switch(attrIdx) {
		case 0: /* maximumRange */
			inst.maximumRange = (Double)val;
			break;
		case 1: /* minDelay */
			inst.minDelay = (Integer)val;
			break;
		case 2: /* vendor */
			inst.vendor = (String)val;
			break;
		case 3: /* version */
			inst.version = (Integer)val;
			break;
		default:
			throw new UnsupportedOperationException();
		}
	}

}
