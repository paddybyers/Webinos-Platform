/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.user;

public final class Org_webinos_api_messaging_MessageSendCallback extends org.meshpoint.anode.js.JSInterface implements org.webinos.api.messaging.MessageSendCallback {

	static int classId = org.meshpoint.anode.bridge.Env.getInterfaceId(org.webinos.api.messaging.MessageSendCallback.class);

	Org_webinos_api_messaging_MessageSendCallback(long instHandle) { super(instHandle); }

	public void finalize() { super.release(classId); }

	private static Object[] __args = new Object[2];

	public void onmessagesenderror(org.webinos.api.DeviceAPIError arg0, String arg1) {
		__args[0] = arg0;
		__args[1] = arg1;
		__invoke(classId, 0, __args);
	}

	public void onmessagesendsuccess(String arg0) {
		__args[0] = arg0;
		__invoke(classId, 1, __args);
	}

	public void onsuccess() {
		__invoke(classId, 2, __args);
	}

}
