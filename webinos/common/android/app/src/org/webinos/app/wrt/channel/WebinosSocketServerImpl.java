package org.webinos.app.wrt.channel;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.webinos.app.wrt.channel.WebinosSocketService.ClientConnection;

import android.content.Context;
import android.content.Intent;

public class WebinosSocketServerImpl extends WebinosSocketServer 
		implements IModule, WebinosSocketService.LaunchListener, WebinosSocketService.ConnectionListener {

	private Context androidContext;	
	WebinosSocketService service;

	/*****************************
	 * Listener methods
	 *****************************/
	@Override
	public void onLaunch(WebinosSocketService service) {
		this.service = service;
		service.setConnectionListener(this);
	}

	@Override
	public void onConnection(ClientConnection client) {
		if(listener != null) {
			WebinosSocketImpl socket = new WebinosSocketImpl(this, client);
			listener.onConnect(socket);
		}
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		androidContext.startService(new Intent(androidContext, WebinosSocketService.class));
		service = WebinosSocketService.getInstance(this);
		if(service != null)
			service.setConnectionListener(this);
		return this;
	}

	@Override
	public void stopModule() {
		if(service != null)
			androidContext.stopService(new Intent(androidContext, WebinosSocketService.class));
	}
}