/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.user;

public final class Org_webinos_api_deviceorientation_OrientationCB extends org.meshpoint.anode.js.JSInterface implements org.webinos.api.deviceorientation.OrientationCB {

	static int classId = org.meshpoint.anode.bridge.Env.getCurrent().getInterfaceManager().getByClass(org.webinos.api.deviceorientation.OrientationCB.class).getId();

	Org_webinos_api_deviceorientation_OrientationCB(long instHandle) { super(instHandle); }

	public void finalize() { super.release(classId); }

	private static Object[] __args = new Object[1];

	public void onOrientationEvent(org.webinos.api.deviceorientation.OrientationEvent arg0) {
		__args[0] = arg0;
		__invoke(classId, 0, __args);
	}

}
