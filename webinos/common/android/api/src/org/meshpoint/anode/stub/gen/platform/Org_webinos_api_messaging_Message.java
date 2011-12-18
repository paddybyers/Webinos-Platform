/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.platform;

public final class Org_webinos_api_messaging_Message {

	private static Object[] __args = new Object[2];

	public static Object[] __getArgs() { return __args; }

	static Object __invoke(org.webinos.api.messaging.Message inst, int opIdx, Object[] args) {
		return inst.update(
			(org.webinos.api.messaging.UpdateMessageSuccessCallback)args[0],
			(org.webinos.api.ErrorCallback)args[1]
		);
	}

	static Object __get(org.webinos.api.messaging.Message inst, int attrIdx) {
		Object result = null;
		switch(attrIdx) {
		case 0: /* body */
			result = inst.body;
			break;
		case 1: /* folder */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)inst.folder);
			break;
		case 2: /* from */
			result = inst.from;
			break;
		case 3: /* id */
			result = inst.id;
			break;
		case 4: /* isRead */
			result = org.meshpoint.anode.js.JSValue.asJSBoolean(inst.isRead);
			break;
		case 5: /* priority */
			result = org.meshpoint.anode.js.JSValue.asJSBoolean(inst.priority);
			break;
		case 6: /* subject */
			result = inst.subject;
			break;
		case 7: /* timestamp */
			result = inst.timestamp;
			break;
		case 8: /* type */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)inst.type);
			break;
		default:
		}
		return result;
	}

	static void __set(org.webinos.api.messaging.Message inst, int attrIdx, Object val) {
		switch(attrIdx) {
		case 0: /* body */
			inst.body = (String)val;
			break;
		case 1: /* folder */
			inst.folder = (int)((org.meshpoint.anode.js.JSValue)val).longValue;
			break;
		case 2: /* from */
			inst.from = (String)val;
			break;
		case 3: /* id */
			inst.id = (String)val;
			break;
		case 4: /* isRead */
			inst.isRead = ((org.meshpoint.anode.js.JSValue)val).getBooleanValue();
			break;
		case 5: /* priority */
			inst.priority = ((org.meshpoint.anode.js.JSValue)val).getBooleanValue();
			break;
		case 6: /* subject */
			inst.subject = (String)val;
			break;
		case 7: /* timestamp */
			inst.timestamp = (java.util.Date)val;
			break;
		case 8: /* type */
			inst.type = (int)((org.meshpoint.anode.js.JSValue)val).longValue;
			break;
		default:
			throw new UnsupportedOperationException();
		}
	}

}
