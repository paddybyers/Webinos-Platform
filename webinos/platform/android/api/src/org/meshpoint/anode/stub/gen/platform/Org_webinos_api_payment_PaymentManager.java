/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.platform;

public final class Org_webinos_api_payment_PaymentManager {

	private static Object[] __args = new Object[5];

	public static Object[] __getArgs() { return __args; }

	static Object __invoke(org.webinos.api.payment.PaymentManager inst, int opIdx, Object[] args) {
		inst.createShoppingBasket(
			(org.webinos.api.payment.SuccessShoppingBasketCallback)args[0],
			(org.webinos.api.payment.PaymentErrorCB)args[1],
			(String)args[2],
			(String)args[3],
			(String)args[4]
		);
		return null;
	}

}
