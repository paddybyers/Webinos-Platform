/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.user;

public class Org_webinos_api_discovery_FindCallback extends org.meshpoint.anode.js.JSInterface implements org.webinos.api.discovery.FindCallback {

	private static int classId = org.meshpoint.anode.bridge.Env.getInterfaceId(org.webinos.api.discovery.FindCallback.class);

	Org_webinos_api_discovery_FindCallback(long instHandle) { super(instHandle); }

	public void finalize() { super.release(classId); }

	private static Object[] __args = new Object[1];

	public void onError(org.webinos.api.discovery.DiscoveryError arg0) {
		__args[0] = arg0;
		__invoke(classId, 0, __args);
	}

	public void onFound(org.webinos.api.discovery.Service arg0) {
		__args[0] = arg0;
		__invoke(classId, 1, __args);
	}

	public void onLost(org.webinos.api.discovery.Service arg0) {
		__args[0] = arg0;
		__invoke(classId, 2, __args);
	}

}