package org.webinos.api.messaging;

import org.webinos.api.DeviceAPIError;

public interface MessageSendCallback {
	public void onsuccess();
	public void onmessagesendsuccess(String recipient);
	public void onmessagesenderror(DeviceAPIError error, String recipient);
}
