/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.platform;

public final class Org_webinos_api_payment_ShoppingBasket {

	private static Object[] __args = new Object[3];

	public static Object[] __getArgs() { return __args; }

	static Object __invoke(org.webinos.api.payment.ShoppingBasket inst, int opIdx, Object[] args) {
		Object result = null;
		switch(opIdx) {
		case 0: /* addItem */
			inst.addItem(
				(org.webinos.api.SuccessCallback)args[0],
				(org.webinos.api.payment.PaymentErrorCB)args[1],
				(org.webinos.api.payment.ShoppingItem)args[2]
			);
			break;
		case 1: /* answerChallenge */
			inst.answerChallenge(
				(String)args[0]
			);
			break;
		case 2: /* checkout */
			inst.checkout(
				(org.webinos.api.SuccessCallback)args[0],
				(org.webinos.api.payment.PaymentErrorCB)args[1],
				(org.webinos.api.payment.PaymentChallengeCB)args[2]
			);
			break;
		case 3: /* getExtras */
			result = inst.getExtras();
			break;
		case 4: /* getItems */
			result = inst.getItems();
			break;
		case 5: /* release */
			inst.release();
			break;
		case 6: /* removeItem */
			inst.removeItem(
				(org.webinos.api.SuccessCallback)args[0],
				(org.webinos.api.payment.PaymentErrorCB)args[1],
				(org.webinos.api.payment.ShoppingItem)args[2]
			);
			break;
		case 7: /* update */
			inst.update(
				(org.webinos.api.SuccessCallback)args[0],
				(org.webinos.api.payment.PaymentErrorCB)args[1]
			);
			break;
		default:
		}
		return result;
	}

}
