package org.webinos.api.messaging;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

import org.webinos.api.DeviceAPIError;
import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;

public abstract class MessagingManager extends Base {
	private static short classId = Env.getInterfaceId(MessagingManager.class);
	protected MessagingManager() { super(classId); }

	public static final int TYPE_SMS = 1;
	public static final int TYPE_MMS = 2;
	public static final int TYPE_EMAIL = 3;
	public static final int FOLDER_INBOX = 1;
	public static final int FOLDER_OUTBOX = 2;
	public static final int FOLDER_DRAFTS = 3;
	public static final int FOLDER_SENTBOX = 4;

	public abstract Message createMessage(Integer type) throws DeviceAPIError;
	public abstract PendingOperation sendMessage(MessageSendCallback successCallback, ErrorCallback errorCallback, Message message) throws DeviceAPIError;
	public abstract PendingOperation findMessages(FindMessagesSuccessCallback successCallback, ErrorCallback errorCallback, MessageFilter filter) throws DeviceAPIError;
	public abstract int onSMS(OnIncomingMessage messageHandler) throws DeviceAPIError;
	public abstract int onMMS(OnIncomingMessage messageHandler) throws DeviceAPIError;
	public abstract int onEmail(OnIncomingMessage messageHandler) throws DeviceAPIError;
	public abstract void unsubscribe(int subscriptionHandler) throws DeviceAPIError;
}
