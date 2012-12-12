package org.webinos.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.webinos.api.SuccessCallback;
import org.webinos.api.payment.PaymentChallengeCB;
import org.webinos.api.payment.PaymentError;
import org.webinos.api.payment.PaymentErrorCB;
import org.webinos.api.payment.PaymentErrors;
import org.webinos.api.payment.ShoppingBasket;
import org.webinos.api.payment.ShoppingItem;
import org.webinos.api.payment.SuccessShoppingBasketCallback;

import android.content.Context;
import android.os.Handler;
import android.os.Message;

import de.dtag.tlabs.wallet.extensions.shopping.api.Answer;
import de.dtag.tlabs.wallet.extensions.shopping.api.Item;
import de.dtag.tlabs.wallet.extensions.shopping.api.Merchant;
import de.dtag.tlabs.wallet.extensions.shopping.api.ShopEngine;

public class ShoppingBasketImpl extends ShoppingBasket implements Handler.Callback {

	private boolean matchItem(ShoppingItem item1, ShoppingItem item2) {
		if(!item1.productID.equals(item2.productID))
			return false;
		if(item1.description != null && item2.description != null && !item1.description.equals(item2.productID))
			return false;
		return true;
	}

	private ShoppingItem hasItem(ShoppingItem item) {
		for(ShoppingItem existingItem : items)
			if(matchItem(existingItem, item))
				return existingItem;
		return null;
	}

	private void updateShoppingItem(ShoppingItem item) {
		/* FIXME: will the underlying shop engine calculate the total price
		 * (taking into account multibuy discounts etc?
		 * For now, we will force the total price to be the count * itemPrice */
		item.itemsPrice = item.itemCount * item.itemPrice;
	}

	private static HashMap<String, Float> currencyPriceFactor = new HashMap<String, Float>();
	static {
		currencyPriceFactor.put("GBP", Float.valueOf(100));
		currencyPriceFactor.put("EUR", Float.valueOf(100));
		currencyPriceFactor.put("USD", Float.valueOf(100));
	}

	private ShopEngine shopEngine;
	private AnswerHandler pendingHandler;
	private List<ShoppingItem> items = new ArrayList<ShoppingItem>();
	private List<ShoppingItem> extras = new ArrayList<ShoppingItem>();
	private float totalBill = 0;

	private static class AnswerHandler {
		private SuccessCallback successCallback;
		private PaymentErrorCB errorCallback;

		AnswerHandler(SuccessCallback successCallback, PaymentErrorCB errorCallback) {
			this.successCallback = successCallback;
			this.errorCallback = errorCallback;
		}
		private void handleAnswer(Answer answer) {
			if(answer.state == Answer.STATE_OK || answer.state == Answer.STATE_CHECKOUT_SUCCESSFUL) {
				if(successCallback != null)
					successCallback.onsuccess();
				return;
			}
			PaymentError error = new PaymentError();
			error.message = answer.message;
			switch(answer.state) {
			case Answer.STATE_CHECKOUT_FAILED:
				//error.code = PaymentErrors.PAYMENT_AUTHENTICATION_FAILED;
				//error.code = PaymentErrors.PAYMENT_CHARGEABLE_EXCEEDED;
				error.code = PaymentErrors.PAYMENT_CHARGE_FAILED;
				break;
			case Answer.STATE_CHECKOUT_NO_ITEMS:
				//error.code = PaymentErrors.BASKET_NOT_OPEN;
				error.code = PaymentErrors.INVALID_OPERATION;
				break;
			case Answer.STATE_ERROR:
				error.code = PaymentErrors.INVALID_OPERATION;
				break;
			case Answer.STATE_ERROR_NO_ITEMS:
				//error.code = PaymentErrors.BASKET_NOT_OPEN;
				error.code = PaymentErrors.INVALID_OPERATION;
				break;
			case Answer.STATE_ERROR_NO_SHOP:
				error.code = PaymentErrors.UNKNOWN_SHOP;
				break;
			case Answer.STATE_ERROR_SHOP_ALLREADY_OPENED:
				error.code = PaymentErrors.INVALID_OPERATION;
				break;
			case Answer.STATE_ERROR_UNKNOWN_ITEM:
				error.code = PaymentErrors.UNKNOWN_ITEM;
				break;
			case Answer.STATE_ERROR_UNKNOWN_SHOP:
				error.code = PaymentErrors.UNKNOWN_SHOP;
				break;
			case Answer.STATE_UNKNOWN:
				error.code = PaymentErrors.INVALID_OPERATION;
				break;
			}
			if(errorCallback != null)
				errorCallback.onError(error);
		}
	}

	static void createShoppingBasket(Context ctx, final SuccessShoppingBasketCallback successCallback,
			PaymentErrorCB errorCallback, String serviceProviderID,
			String customerID, String shopID) {

		final ShoppingBasketImpl shoppingBasket = new ShoppingBasketImpl(ctx);
		/* FIXME: where will we get the merchant token? */
		Merchant merchant = new Merchant(shopID, null);
		AnswerHandler openHandler = new AnswerHandler(new SuccessCallback() {
			@Override
			public void onsuccess() {
				successCallback.onShoppingBasketSuccess(shoppingBasket);
			}}, errorCallback);
		shoppingBasket.setPendingHandler(openHandler);
		shoppingBasket.shopEngine.openShop(merchant);
	}
	private ShoppingBasketImpl(Context ctx) {
		shopEngine = new ShopEngine(ctx, this);
	}

	@Override
	public float getTotalBill() {
		if(shopEngine == null) {
			return (float)0;
		}
		update(null, null);
		return totalBill;
	}

	@Override
	public ShoppingItem[] getItems() {
		return items.toArray(new ShoppingItem[items.size()]);
	}

	@Override
	public ShoppingItem[] getExtras() {
		return extras.toArray(new ShoppingItem[extras.size()]);
	}

	@Override
	public void addItem(final SuccessCallback successCallback,
			PaymentErrorCB errorCallback, final ShoppingItem shoppingItem) {
		PaymentError error;
		if(shopEngine == null) {
			error = new PaymentError();
			error.code = PaymentErrors.BASKET_NOT_OPEN;
			error.message = "No shopEngine";
			errorCallback.onError(error);
			return;
		}
		String productID = shoppingItem.productID;
		String productName = shoppingItem.productID; /* FIXME: do we need an explicit product name */
		String productDescription = shoppingItem.description;
		String currency = shoppingItem.currency;
		Float currencyFactor = currencyPriceFactor.get(currency);
		if(currency == null) {
			error = new PaymentError();
			error.code = PaymentErrors.CURRENCY_NOT_SUPPORTED;
			error.message = "Currency " + currency + " not supported";
			errorCallback.onError(error);
			return;
		}
		long price = (long)(shoppingItem.itemPrice * currencyFactor.floatValue());
		int count = shoppingItem.itemCount;
		Item item = new Item(productID, productName, productDescription, currency, price, count);
		setPendingHandler(new AnswerHandler(new SuccessCallback() {
			@Override
			public void onsuccess() {
				updateShoppingItem(shoppingItem);
				items.add(shoppingItem);
				successCallback.onsuccess();
			}}, errorCallback));
		shopEngine.addItem(item);
	}

	@Override
	public void removeItem(final SuccessCallback successCallback,
			PaymentErrorCB errorCallback, ShoppingItem shoppingItem) {
		PaymentError error;
		if(shopEngine == null) {
			error = new PaymentError();
			error.code = PaymentErrors.BASKET_NOT_OPEN;
			error.message = "No shopEngine";
			errorCallback.onError(error);
			return;
		}
		int count = shoppingItem.itemCount;
		if(count != 1) {
			error = new PaymentError();
			error.code = PaymentErrors.INVALID_OPERATION;
			error.message = "Unable to remove multiple items";
			errorCallback.onError(error);
			return;
		}
		final ShoppingItem itemToRemove;
		if((itemToRemove = hasItem(shoppingItem)) == null) {
			error = new PaymentError();
			error.code = PaymentErrors.INVALID_OPERATION;
			error.message = "Unable to find specified item in shopping basket";
			errorCallback.onError(error);
			return;
		}
		shopEngine.removeItem(itemToRemove.productID);
		setPendingHandler(new AnswerHandler(new SuccessCallback() {
			@Override
			public void onsuccess() {
				items.remove(itemToRemove);
				successCallback.onsuccess();
			}}, errorCallback));
	}

	@Override
	public void update(SuccessCallback successCallback,
			PaymentErrorCB errorCallback) {
		/* FIXME: will there be an update() method in the
		 * underlying engine? */
		float totalBill = 0;
		for(ShoppingItem item : items) {
			updateShoppingItem(item);
			totalBill += item.itemsPrice;
		}
		this.totalBill = totalBill;
		if(successCallback != null)
			successCallback.onsuccess();
	}

	@Override
	public void checkout(SuccessCallback successCallback,
			PaymentErrorCB errorCallback, PaymentChallengeCB challengeCallback) {
		PaymentError error;
		if(shopEngine == null) {
			error = new PaymentError();
			error.code = PaymentErrors.BASKET_NOT_OPEN;
			error.message = "No shopEngine";
			errorCallback.onError(error);
			return;
		}
		setPendingHandler(new AnswerHandler(successCallback, errorCallback));
		shopEngine.checkout();
	}

	@Override
	public void answerChallenge(String userResponse) {
		/* nothing to do because challenge callback will never be called */
	}

	@Override
	public void release() {
		synchronized(this) {
			if(shopEngine != null) {
				shopEngine.release();
				shopEngine = null;
			}
		}
	}

	public void finalize() {
		release();
	}

	/*
	 * Callbacks for async indications from the shop engine
	 * @see android.os.Handler.Callback#handleMessage(android.os.Message)
	 */
	@Override
	public boolean handleMessage(Message msg) {
		AnswerHandler answerHandler;
		synchronized(this) {
			answerHandler = pendingHandler;
			pendingHandler = null;
		}
		if(answerHandler == null)
			return false;

		Answer answer = (Answer)msg.obj;
		answerHandler.handleAnswer(answer);
		return true;
	}

	private synchronized void setPendingHandler(AnswerHandler handler) {
		if(pendingHandler != null)
			throw new Error("Unable to schedule an async operation with another operation already pending");
		pendingHandler = handler;
	}
}
