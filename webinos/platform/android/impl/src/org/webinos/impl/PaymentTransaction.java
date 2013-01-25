package org.webinos.impl;

import org.webinos.api.payment.PaymentError;
import org.webinos.api.payment.PaymentErrorCB;
import org.webinos.api.payment.PaymentErrors;
import org.webinos.api.payment.PaymentSuccessCB;
import org.webinos.api.payment.ShoppingItem;

import android.content.Context;
import android.os.Handler;
import android.os.Message;
import de.dtag.tlabs.wallet.extensions.shopping.api.Answer;
import de.dtag.tlabs.wallet.extensions.shopping.api.Item;
import de.dtag.tlabs.wallet.extensions.shopping.api.Merchant;
import de.dtag.tlabs.wallet.extensions.shopping.api.ShopEngine;

public class PaymentTransaction implements Handler.Callback {

	private ShopEngine shopEngine;
	private AnswerHandler pendingHandler;
	private String customerID;
	final private PaymentSuccessCB successCallback;
	final private PaymentErrorCB errorCallback;

	private class AnswerHandler {

		AnswerHandler(PaymentSuccessCB successCallback, PaymentErrorCB errorCallback) {
		}
		private void handleAnswer(Answer answer) {
			if(answer.state == Answer.STATE_OK || answer.state == Answer.STATE_CHECKOUT_SUCCESSFUL) {
				if(successCallback != null)
					successCallback.onSuccess("");
				synchronized(this) {
					notify();
				}
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
				error.code = PaymentErrors.INVALID_OPTION;
				break;
			case Answer.STATE_ERROR:
				error.code = PaymentErrors.INVALID_OPTION;
				break;
			case Answer.STATE_ERROR_NO_ITEMS:
				error.code = PaymentErrors.INVALID_OPTION;
				break;
			case Answer.STATE_ERROR_NO_SHOP:
				error.code = PaymentErrors.UNKNOWN_SHOP;
				break;
			case Answer.STATE_ERROR_SHOP_ALLREADY_OPENED:
				error.code = PaymentErrors.INVALID_OPTION;
				break;
			case Answer.STATE_ERROR_UNKNOWN_ITEM:
				error.code = PaymentErrors.INVALID_OPTION;
				break;
			case Answer.STATE_ERROR_UNKNOWN_SHOP:
				error.code = PaymentErrors.UNKNOWN_SHOP;
				break;
			case Answer.STATE_UNKNOWN:
				error.code = PaymentErrors.INVALID_OPTION;
				break;
			}
			if(errorCallback != null)
				errorCallback.onError(error);
			synchronized(this) {
				notify();
			}
		}
	}

	public PaymentTransaction(Context ctx, String customerID, String sellerID, PaymentSuccessCB successCallback,
			PaymentErrorCB errorCallback) {
		shopEngine = new ShopEngine(ctx, this);
		this.customerID = customerID;
		this.successCallback = successCallback;
		this.errorCallback = errorCallback;

		/* FIXME: where will we get the merchant token? */
		Merchant merchant = new Merchant(sellerID, null);
		AnswerHandler openHandler = new AnswerHandler(null, errorCallback);
		setPendingHandler(openHandler);
		synchronized(openHandler) {
			shopEngine.openShop(merchant);
			try {
				/* FIXME: do we need a timeout? */
				openHandler.wait();
			} catch(InterruptedException ie) {}
		}
	}

	public void addItemList(ShoppingItem[] itemList, ShoppingItem bill) {
		String productID = bill.productID;
		String productName = bill.productID; /* FIXME: do we need an explicit product name */
		String productDescription = bill.description;
		String currency = bill.currency;
		/* FIXME: change this multiplier based on currency? */
		long price = (long)(bill.itemsPrice * 100);
		
		AnswerHandler openHandler = new AnswerHandler(null, errorCallback);
		setPendingHandler(openHandler);
		synchronized(openHandler) {
			shopEngine.addItem(new Item(productID, productName, productDescription, currency, price, 1));
			try {
				/* FIXME: do we need a timeout? */
				openHandler.wait();
			} catch(InterruptedException ie) {}
		}
	}

	public void checkout() {
		AnswerHandler openHandler = new AnswerHandler(successCallback, errorCallback);
		setPendingHandler(openHandler);
		synchronized(openHandler) {
			shopEngine.checkout();
			try {
				/* FIXME: do we need a timeout? */
				openHandler.wait();
			} catch(InterruptedException ie) {}
		}
	}

	public void finalize() {
		synchronized(this) {
			if(shopEngine != null) {
				shopEngine.release();
				shopEngine = null;
			}
		}
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
