/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.user;

public final class Org_webinos_api_messaging_OnIncomingMessage extends org.meshpoint.anode.js.JSInterface implements org.webinos.api.messaging.OnIncomingMessage {

	static int classId = org.meshpoint.anode.bridge.Env.getCurrent().getInterfaceManager().getByClass(org.webinos.api.messaging.OnIncomingMessage.class).getId();

	Org_webinos_api_messaging_OnIncomingMessage(long instHandle) { super(instHandle); }

	public void finalize() { super.release(classId); }

	private static Object[] __args = new Object[1];

	public void onEvent(org.webinos.api.messaging.Message arg0) {
		__args[0] = arg0;
		__invoke(classId, 0, __args);
	}

}
