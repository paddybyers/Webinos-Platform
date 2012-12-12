package org.webinos.api.payment;

import org.meshpoint.anode.idl.Callback;

public interface SuccessShoppingBasketCallback extends Callback {
	public void onShoppingBasketSuccess(ShoppingBasket basket);
}
