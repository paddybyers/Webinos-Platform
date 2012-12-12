package org.webinos.api.payment;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;
import org.webinos.api.SuccessCallback;

public abstract class ShoppingBasket extends Base {
	private static short classId = Env.getInterfaceId(ShoppingBasket.class);
	protected ShoppingBasket() { super(classId); }

	public abstract float getTotalBill();
	public abstract ShoppingItem[] getItems();
	public abstract ShoppingItem[] getExtras();
	
	public abstract void addItem(SuccessCallback successCallback, PaymentErrorCB errorCallback, ShoppingItem item);
	public abstract void removeItem(SuccessCallback successCallback, PaymentErrorCB errorCallback, ShoppingItem item);
	public abstract void update(SuccessCallback successCallback, PaymentErrorCB errorCallback);
	public abstract void checkout(SuccessCallback successCallback, PaymentErrorCB errorCallback, PaymentChallengeCB challengeCallback);
	public abstract void answerChallenge(String userResponse);

	public abstract void release();

}
