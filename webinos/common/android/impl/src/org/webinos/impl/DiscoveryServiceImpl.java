package org.webinos.impl;

import java.io.IOException;
import java.io.InputStream;

import org.meshpoint.anode.bridge.Env;
import org.webinos.api.PendingOperation;
import org.webinos.api.discovery.BindCallback;
import org.webinos.api.discovery.DiscoveryError;
import org.webinos.api.discovery.Service;

import org.webinos.impl.DiscoveryImpl.DiscoveryRunnable;
import org.webinos.impl.DiscoveryImpl.DiscoveryPendingOperation;

import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.util.Log;

public class DiscoveryServiceImpl extends Service{

	private static final String TAG = "org.webinos.impl.DiscoveryServiceImpl";
	private Context androidContext;
	
	@Override
	public PendingOperation bind(BindCallback bindCallback,  String serviceId) throws DiscoveryError{

	Log.v(TAG, "bind Service");
		
	return null;
	
	}
	
	public void setContext(Context androidContext) {
		Log.v(TAG, "setContext");
		this.androidContext = androidContext;
	}
	
    public void unbind() throws DiscoveryError{
    }
}