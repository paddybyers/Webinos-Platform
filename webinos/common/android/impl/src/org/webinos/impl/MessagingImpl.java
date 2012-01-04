package org.webinos.impl;

import android.telephony.SmsManager;
//import android.telephony.SmsMessage;
import android.util.Log;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.BroadcastReceiver;
import android.os.Bundle;
import android.database.Cursor;
import android.net.Uri;

import java.util.ArrayList;

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
	private	SmsManager	smsManager;

	private static final String LABEL = "org.webinos.impl.MessagingImpl";
//	private static final String SMS_SENT = "org.webinos.messaging.SMS_SENT";
	
	/*****************************
	 * MessagingManager methods
	 *****************************/
	@Override
	public Message createMessage(Integer type) throws DeviceAPIError {
		Log.v(LABEL, "createMessage");
		if (type == null) {
			throw new DeviceAPIError(DeviceAPIError.TYPE_MISMATCH_ERR);
		}
		if (type == TYPE_SMS) {
			Message msg = new MessageImpl();
			msg.type = type;
			return msg;
		}
		else if (type==TYPE_MMS || type==TYPE_EMAIL || type==TYPE_IM) {
			 //TODO Add support for mms, email and im
			return null;
		}
		else {
			throw new DeviceAPIError(DeviceAPIError.INVALID_VALUES_ERR);
		}
	}

	@Override
	public PendingOperation sendMessage(MessageSendCallback successCallback,
			ErrorCallback errorCallback, Message message) throws DeviceAPIError {
		// TODO Two sendMessage are defined in specs (difference is the callback); how to handle this?
		Log.v(LABEL, "sendMessage");
		if(successCallback == null || message == null) {
			Log.v(LABEL, "sendMessage error (successCallback or message null)");
			if(errorCallback!=null) {
				errorCallback.onerror(new DeviceAPIError(DeviceAPIError.INVALID_VALUES_ERR));
			}
			return null;
		}
		Log.v(LABEL, "sendMessage - 02 ("+message.to.getLength()+")");
		if(message.type == TYPE_SMS) {
			if(message.to.getLength()>0){
				Runnable smsSender = new SmsSender(successCallback, errorCallback, message);
				Thread t = new Thread(smsSender);
				t.start();
				Log.v(LABEL, "sendMessage - thread started with id "+(int)t.getId());
			}
			else {
				//TODO what if the message has 0 recipients?
				Log.v(LABEL, "sendMessage - message has 0 recipients");
			}
		}
		else {
			Log.v(LABEL, "sendMessage - 08");
			//TODO Add support for mms, email and im
			throw new DeviceAPIError(DeviceAPIError.NOT_SUPPORTED_ERR);
		}
		//TODO The method should return a PendingOperation
		return null;
	}

	@Override
	public PendingOperation findMessages(
			FindMessagesSuccessCallback successCallback,
			ErrorCallback errorCallback, MessageFilter filter)
			throws DeviceAPIError {
		Log.v(LABEL, "findMessages");

		Runnable smsFinder = new SmsFinder(successCallback, errorCallback, filter);
		Thread t = new Thread(smsFinder);
		t.start();
		
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
		Log.v(LABEL, "startModule");
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		smsManager = SmsManager.getDefault();
		return this;
	}

	@Override
	public void stopModule() {
		Log.v(LABEL, "stopModule");
	}
	
	//sms sender
	class SmsSender implements Runnable {
		
		private MessageSendCallback successCallback;
		private ErrorCallback errorCallback;
		private Message message;
		private int smsCounter;
		private SmsResponseReceiver smsResponseReceiver;
		private String SMS_SENT;
		private ArrayList<String> bodyParts;

		private SmsSender(MessageSendCallback succCallback, ErrorCallback errCallback, Message msg) {
			successCallback = succCallback;
			errorCallback = errCallback;
			message = msg;
			smsCounter = 0;
			smsResponseReceiver = new SmsResponseReceiver(successCallback, errorCallback, message.to.getLength(), this);
			Log.v(LABEL, "SmsSender constructed");
		}
		
		public void run() {
			
			SMS_SENT = "org.webinos.messaging.SMS_SENT_"+(int)Thread.currentThread().getId();
			androidContext.registerReceiver(smsResponseReceiver, new IntentFilter(SMS_SENT));
			bodyParts = smsManager.divideMessage(message.body);
			Log.v(LABEL, "SmsSender run - number of parts is "+bodyParts.size()+" - SMS_SENT is "+SMS_SENT);
			sendNextMessage();
			
			/*
			ArrayList<String> bodyParts = smsManager.divideMessage(message.body);
			Log.v(LABEL, "SmsSender run - number of parts is "+bodyParts.size());
			for(int i=0; i<message.to.getLength(); i++) {
				Log.v(LABEL, "SmsSender run - 04 ("+i+")");
				try {
					Intent intent=new Intent(SMS_SENT);
					intent.putExtra("rec", message.to.getElement(i));
					PendingIntent pnd = PendingIntent.getBroadcast(androidContext, 0, intent, 0);
					//TODO add support for longer messages
					if(bodyParts.size() == 1) {
						smsManager.sendTextMessage(message.to.getElement(i), null, message.body, pnd, null);
					}
					else {
						ArrayList<PendingIntent> pndList = new ArrayList<PendingIntent>();
						for(int j=0;j<bodyParts.size()-1;j++){
							pndList.add(null);
						}
						pndList.add(pnd);
						smsManager.sendMultipartTextMessage(message.to.getElement(i), null, bodyParts, pndList, null);
					}
				}
//				catch(IllegalArgumentException e) {
				catch(Exception e) {
					Log.v(LABEL, "SmsSender run - error "+e);
					smsResponseReceiver.errorCaught(message.to.getElement(i));
				}
			}
			*/
		}
		
		public void sendFinished() {
			Log.v(LABEL, "SmsSender - sendFinished");
			androidContext.unregisterReceiver(smsResponseReceiver);
		}
		
		public void sendNextMessage() {
			Log.v(LABEL, "SmsSender - sendNextMessage");
			if(smsCounter<message.to.getLength()) {
				try {
					Intent intent=new Intent(SMS_SENT);
					intent.putExtra("rec", message.to.getElement(smsCounter));
					Log.v(LABEL, "intent created with rec = "+intent.getExtras().getString("rec"));
					PendingIntent pnd = PendingIntent.getBroadcast(androidContext, 0, intent, 0);
					//TODO add support for longer messages
					if(bodyParts.size() == 1) {
						smsManager.sendTextMessage(message.to.getElement(smsCounter), null, message.body, pnd, null);
					}
					else {
						ArrayList<PendingIntent> pndList = new ArrayList<PendingIntent>();
						for(int j=0;j<bodyParts.size()-1;j++){
							pndList.add(null);
						}
						pndList.add(pnd);
						smsManager.sendMultipartTextMessage(message.to.getElement(smsCounter), null, bodyParts, pndList, null);
					}
				}
//				catch(IllegalArgumentException e) {
				catch(Exception e) {
					Log.v(LABEL, "SmsSender run - error "+e);
					smsResponseReceiver.errorCaught(message.to.getElement(smsCounter));
				}

				smsCounter++;
			}
		}
	}
	
	
	//SMS Response receiver
	class SmsResponseReceiver extends BroadcastReceiver {
		
		private MessageSendCallback successCallback;
		private ErrorCallback errorCallback;
		private int smsNumber;
		private int smsCounter;
		private int errorCounter;
		private SmsSender smsSender;
		
		@Override
		public void onReceive(Context ctx, Intent intent) {
			String rec=null;
			Bundle extras = intent.getExtras();
			if(extras!=null){
				rec=extras.getString("rec");
			}
			switch(getResultCode()) {
			case Activity.RESULT_OK:
				Log.v(LABEL, "SmsResponseReceiver - Received intent OK ("+getResultCode()+") for rec "+rec);
				sendFinished(0, rec);
				break;
			default:
				Log.v(LABEL, "SmsResponseReceiver - Received intent error ("+getResultCode()+") for rec "+rec);
				sendFinished(1, rec);
				break;
			}
		}
		
		private SmsResponseReceiver(MessageSendCallback successCbk, ErrorCallback errorCbk, int smsNum, SmsSender sender) {
			Log.v(LABEL, "SmsResponseReceiver constructor - succCbk: "+successCbk+" - errCbk: "+errorCbk+" - thread: "+(int)Thread.currentThread().getId());
			successCallback = successCbk;
			errorCallback = errorCbk;
			smsNumber = smsNum;
			smsCounter = 0;
			errorCounter = 0;
			smsSender = sender;
		}
		
		public void errorCaught(String recipient) {
			sendFinished(1, recipient);
		}
		
		private void sendFinished(int res, String recipient) {
			smsCounter++;
			errorCounter+=res;
			Log.v(LABEL, "SmsResponseReceiver sendFinished - sms n "+smsCounter+" - err n "+errorCounter);
			if(smsCounter == smsNumber) {
				smsSender.sendFinished();
				if(errorCounter==0) {
					Log.v(LABEL, "SmsResponseReceiver sendFinished - successCallback");
					successCallback.onsuccess();
				}
				else {
					Log.v(LABEL, "SmsResponseReceiver sendFinished - errorCallback");
					errorCallback.onerror(new DeviceAPIError(DeviceAPIError.UNKNOWN_ERR));
				}
			}
			else {
				if(res==0) {
					Log.v(LABEL, "SmsResponseReceiver sendFinished - msgSendSuccess");
					successCallback.onmessagesendsuccess(recipient);
				}
				else {
					Log.v(LABEL, "SmsResponseReceiver sendFinished - msgSendError");
					successCallback.onmessagesenderror(new DeviceAPIError(DeviceAPIError.UNKNOWN_ERR), recipient);
				}
				smsSender.sendNextMessage();
			}
		}
		
	}
	
	class SmsFinder implements Runnable {

		private FindMessagesSuccessCallback successCallback;
		private ErrorCallback errorCallback;
		private MessageFilter filter;
		
		private SmsFinder(FindMessagesSuccessCallback successCallback, ErrorCallback errorCallback, MessageFilter filter) {
			this.successCallback = successCallback;
			this.errorCallback = errorCallback;
			this.filter = filter;
		}
		
		public void run() {
			Log.v(LABEL, "smsFinder run");
			try {
//				Uri uriSMSURI = Uri.parse("content://sms/inbox");
				Uri uriSMSURI = Uri.parse("content://sms/sent");
//				Uri uriSMSURI = Uri.parse("content://sms");
				Cursor cursor = androidContext.getContentResolver().query(uriSMSURI, new String[] { "_id", "thread_id", "address", "date", "read", "status", "type", "body" }, null, null,null);
//				Cursor cursor = androidContext.getContentResolver().query(uriSMSURI, null, null, null,null);
				for(int i=0; i<cursor.getColumnCount(); i++) {
					Log.v(LABEL, "Column "+i+" name: "+cursor.getColumnName(i));
				}
				Log.v(LABEL, "smsFinder run - 02");
				Message[] result;
				Message msg;
				result = new Message[cursor.getCount()];
				Log.v(LABEL, "smsFinder run - 03");
				for(int i=0; i<cursor.getCount(); i++) {
					Log.v(LABEL, "smsFinder run - 051");
					msg = new MessageImpl();
					Log.v(LABEL, "smsFinder run - 052");
					msg.id = cursor.getString(cursor.getColumnIndex("_id"));
					msg.body = cursor.getString(cursor.getColumnIndex("body"));
					Log.v(LABEL, "smsFinder run - 054");
					result[i] = msg;
					Log.v(LABEL, "smsFinder run - 055");

					/*
					result[i] = new MessageImpl();
					result[i].id = cursor.getString(cursor.getColumnIndex("_id"));
					result[i].type = TYPE_SMS;
					//result[i].folder = ???;
					//result[i].timestamp = ;
					//result[i].from = ;
					//result[i].to = ;
					result[i].body = cursor.getString(cursor.getColumnIndex("body"));
					//result[i].isRead = cursor.getString(cursor.getColumnIndex("read"));
					*/
				}
				successCallback.onSuccess(result);

				/*
				while (cursor.moveToNext()) {
					
					String dbgstr = new String("Msg:");
					for(int i=0; i<cursor.getColumnCount(); i++) {
						dbgstr+=cursor.getString(i)+" - ";
					}
					Log.v(LABEL, dbgstr);
				}
				*/
			}
			catch(Exception e) {
				Log.v(LABEL, "smsFinder run, error: "+e);
				errorCallback.onerror(new DeviceAPIError(DeviceAPIError.UNKNOWN_ERR));
			}
		      
			Log.v(LABEL, "smsFinder run - END");
			
		}
	}
	
}
