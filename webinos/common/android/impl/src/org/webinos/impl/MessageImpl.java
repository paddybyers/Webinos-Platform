package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.webinos.api.DeviceAPIError;
import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;
import org.webinos.api.messaging.Message;
import org.webinos.api.messaging.UpdateMessageSuccessCallback;

import android.content.Context;
import android.util.Log;

public class MessageImpl extends Message implements IModule {

	private Context androidContext;
	private static final String LABEL = "WebinosMessaging";
	
	@Override
    public PendingOperation update(UpdateMessageSuccessCallback successCallback, ErrorCallback errorCallback) throws DeviceAPIError {
		return null;
	}

    /*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
		Log.d(LABEL, "MessageImpl - startModule");
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		/*
		 * perform any module initialisation here ...
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
