/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2011-2012 Toby Ealden
 *
 ******************************************************************************/

package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.webinos.api.DeviceAPIError;
import org.webinos.api.payment.PaymentErrorCB;
import org.webinos.api.payment.PaymentManager;
import org.webinos.api.payment.PaymentSuccessCB;

import android.content.Context;
import android.content.Intent;

public class PaymentImpl extends PaymentManager implements IModule {
	static final String TAG = PaymentImpl.class.getCanonicalName();

	private Context androidContext;
	static PaymentSuccessCB pendingSuccessCB;
	static PaymentErrorCB pendingErrorCB;
	static Env env = Env.getCurrent();

	/*****************************
	 * PaymentManager methods
	 *****************************/
	@Override
	public void checkout(PaymentSuccessCB successCB, PaymentErrorCB errorCB, long implCustomerID, long implShopID,  long totalBill, String currency) {

		if (successCB == null) throw new DeviceAPIError(DeviceAPIError.TYPE_MISMATCH_ERR);

		Intent paymentActivityIntent = new Intent(androidContext, PaymentActivity.class);
		paymentActivityIntent.putExtra("customerId", implCustomerID);
		paymentActivityIntent.putExtra("shopId", implShopID);
		paymentActivityIntent.putExtra("totalBill", totalBill);
		paymentActivityIntent.putExtra("currency", currency);

		pendingSuccessCB = successCB;
		pendingErrorCB = errorCB;

		androidContext.startActivity(paymentActivityIntent);
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		/*
		 * perform module initialisation here ...
		 */



		return this;
	}

	@Override
	public void stopModule() {
		/*
		 * perform any module shutdown here ...
		 */
	}
}
