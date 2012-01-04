package org.webinos.impl;

import org.webinos.api.DeviceAPIError;
import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;
import org.webinos.api.messaging.Message;
import org.webinos.api.messaging.UpdateMessageSuccessCallback;

import android.util.Log;

public class MessageImpl extends Message {

	private static final String LABEL = "WebinosMessaging";
	
	@Override
    public PendingOperation update(UpdateMessageSuccessCallback successCallback, ErrorCallback errorCallback) throws DeviceAPIError {
		return null;
	}
}
