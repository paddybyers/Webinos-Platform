/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.user;

public class Org_webinos_api_wrtchannel_WebinosSocketListener extends org.meshpoint.anode.js.JSInterface implements org.webinos.api.wrtchannel.WebinosSocketListener {

	private static int classId = org.meshpoint.anode.bridge.Env.getInterfaceId(org.webinos.api.wrtchannel.WebinosSocketListener.class);

	Org_webinos_api_wrtchannel_WebinosSocketListener(long instHandle) { super(instHandle); }

	public void finalize() { super.release(classId); }

	private static Object[] __args = new Object[1];

	public void onClose(String arg0) {
		__args[0] = arg0;
		__invoke(classId, 0, __args);
	}

	public void onError(String arg0) {
		__args[0] = arg0;
		__invoke(classId, 1, __args);
	}

	public void onMessage(org.webinos.api.wrtchannel.Event arg0) {
		__args[0] = arg0;
		__invoke(classId, 2, __args);
	}

}
