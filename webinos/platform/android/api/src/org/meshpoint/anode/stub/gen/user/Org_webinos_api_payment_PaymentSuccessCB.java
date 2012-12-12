/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.user;

public final class Org_webinos_api_payment_PaymentSuccessCB extends org.meshpoint.anode.js.JSInterface implements org.webinos.api.payment.PaymentSuccessCB {

	static int classId = org.meshpoint.anode.bridge.Env.getCurrent().getInterfaceManager().getByClass(org.webinos.api.payment.PaymentSuccessCB.class).getId();

	Org_webinos_api_payment_PaymentSuccessCB(long instHandle) { super(instHandle); }

	public void finalize() { super.release(classId); }

	private static Object[] __args = new Object[0];

	public void onSuccess() {
		__invoke(classId, 0, __args);
	}

}
