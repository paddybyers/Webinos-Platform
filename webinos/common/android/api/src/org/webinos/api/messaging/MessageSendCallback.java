package org.webinos.api.messaging;

import org.webinos.api.DeviceAPIError;
import org.webinos.api.SuccessCallback;

public interface MessageSendCallback extends SuccessCallback {
	public void onmessagesendsuccess(String recipient);
	public void onmessagesenderror(DeviceAPIError error, String recipient);
}
