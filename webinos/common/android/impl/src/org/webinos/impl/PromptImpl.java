package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;

import org.webinos.api.DeviceAPIError;
import org.webinos.api.prompt.PromptManager;
import org.webinos.impl.PromptActivity;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.util.Log;
import android.content.Intent;

import android.os.Bundle;

import java.util.concurrent.CountDownLatch;


public class PromptImpl extends PromptManager implements IModule {

	private Context androidContext;

	private static final String LABEL = "org.webinos.impl.PromptImpl";
	
	private int resultCode;
	PromptResponseReceiver responseReceiver;
	CountDownLatch latch;

	/*****************************
	 * PromptManager methods
	 *****************************/

	@Override
	public int display(String message, String[] choice) throws DeviceAPIError {
		String dbg = message;
		for(String i: choice) {
			dbg+=" - "+i;
		}
		Log.v(LABEL, "display: "+dbg);
		setResult(-1);
		try {
			Log.v(LABEL, "display - 1");
			Intent intent = new Intent(androidContext, PromptActivity.class);
			intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
			intent.putExtra(LABEL+".message", message);
			intent.putExtra(LABEL+".choice", choice);
			Log.v(LABEL, "display - 2");
			
			responseReceiver = new PromptResponseReceiver(this);
			androidContext.registerReceiver(responseReceiver, new IntentFilter("org.webinos.impl.PromptImpl.PROMPT_RESPONSE"));
			latch = new CountDownLatch(1);
			androidContext.startActivity(intent);
			Log.v(LABEL, "display - 3");
			latch.await();
			Log.v(LABEL, "display - 4");
						
		}
		catch(Exception e) {
			Log.v(LABEL, "display exception "+e.getMessage());
		}
		
		Log.v(LABEL, "display - return "+getResult());
		return getResult();
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		Log.v(LABEL, "prompt - startModule");
		return this;
	}

	@Override
	public void stopModule() {
		Log.v(LABEL, "prompt - stopModule");
	}
	
	private synchronized void setResult(int res) {
		resultCode = res;
	}
	
	private synchronized int getResult() {
		return resultCode;
	}
	
	class PromptResponseReceiver extends BroadcastReceiver {
		
		private PromptImpl p;
		
		private PromptResponseReceiver(PromptImpl p) {
			this.p = p;
		}
		
		public void onReceive(Context ctx, Intent intent) {
			Log.v(LABEL, "PromptResponseReceiver - onReceive");
			Bundle extras = intent.getExtras();
			synchronized (this) {
				if(extras!=null) {
					p.setResult(extras.getInt("response"));
				}
				Log.v(LABEL, "PromptResponseReceiver - onReceive end");
				latch.countDown();
			}
		}

	}

}


