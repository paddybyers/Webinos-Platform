/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.platform;

public class Org_webinos_api_discovery_Service {

	private static Object[] __args = new Object[2];

	public static Object[] __getArgs() { return __args; }

	static Object __invoke(org.webinos.api.discovery.Service inst, int opIdx, Object[] args) {
		Object result = null;
		switch(opIdx) {
		case 0: /* bind */
			result = inst.bind(
				(org.webinos.api.discovery.BindCallback)args[0],
				(String)args[1]
			);
			break;
		case 1: /* unbind */
			inst.unbind();
			break;
		default:
		}
		return result;
	}

	static Object __get(org.webinos.api.discovery.Service inst, int attrIdx) {
		Object result = null;
		switch(attrIdx) {
		case 0: /* SERVICE_AVAILABLE */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)org.webinos.api.discovery.Service.SERVICE_AVAILABLE);
			break;
		case 1: /* SERVICE_INITATING */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)org.webinos.api.discovery.Service.SERVICE_INITATING);
			break;
		case 2: /* SERVICE_UNAVAILABLE */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)org.webinos.api.discovery.Service.SERVICE_UNAVAILABLE);
			break;
		case 3: /* api */
			result = inst.api;
			break;
		case 4: /* description */
			result = inst.description;
			break;
		case 5: /* displayName */
			result = inst.displayName;
			break;
		case 6: /* icon */
			result = inst.icon;
			break;
		case 7: /* id */
			result = inst.id;
			break;
		case 8: /* state */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)inst.state);
			break;
		default:
		}
		return result;
	}

	static void __set(org.webinos.api.discovery.Service inst, int attrIdx, Object val) {
		switch(attrIdx) {
		case 3: /* api */
			inst.api = (String)val;
			break;
		case 4: /* description */
			inst.description = (String)val;
			break;
		case 5: /* displayName */
			inst.displayName = (String)val;
			break;
		case 6: /* icon */
			inst.icon = (String)val;
			break;
		case 7: /* id */
			inst.id = (String)val;
			break;
		case 8: /* state */
			inst.state = (int)((org.meshpoint.anode.js.JSValue)val).longValue;
			break;
		default:
			throw new UnsupportedOperationException();
		}
	}

}
