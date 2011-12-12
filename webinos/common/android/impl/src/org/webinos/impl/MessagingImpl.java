package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.webinos.api.DeviceAPIError;
import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;
import org.webinos.api.messaging.FindMessagesSuccessCallback;
import org.webinos.api.messaging.Message;
import org.webinos.api.messaging.MessageFilter;
import org.webinos.api.messaging.MessageSendCallback;
import org.webinos.api.messaging.MessagingManager;
import org.webinos.api.messaging.OnIncomingMessage;

import android.content.Context;

public class MessagingImpl extends MessagingManager implements IModule {

	private Context androidContext;
	
	/*****************************
	 * MessagingManager methods
	 *****************************/
	@Override
	public Message createMessage(Integer type) throws DeviceAPIError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public PendingOperation sendMessage(MessageSendCallback successCallback,
			ErrorCallback errorCallback, Message message) throws DeviceAPIError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public PendingOperation findMessages(
			FindMessagesSuccessCallback successCallback,
			ErrorCallback errorCallback, MessageFilter filter)
			throws DeviceAPIError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public int onSMS(OnIncomingMessage messageHandler) throws DeviceAPIError {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public int onMMS(OnIncomingMessage messageHandler) throws DeviceAPIError {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public int onEmail(OnIncomingMessage messageHandler) throws DeviceAPIError {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public void unsubscribe(int subscriptionHandler) throws DeviceAPIError {
		// TODO Auto-generated method stub
		
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
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
