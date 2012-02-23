package org.webinos.app.wrt.channel;


public class WebinosSocketImpl extends WebinosSocket implements WebinosSocketService.ClientListener {
	
	private final WebinosSocketService service;
	private final WebinosSocketService.ClientConnection client;

	WebinosSocketImpl(WebinosSocketServerImpl server, WebinosSocketService.ClientConnection client) {
		super(server.getEnv());
		this.service = server.service;
		this.client = client;
		this.installId = client.installId;
		this.instanceId = client.instanceId;
		client.listener = this;
	}

	@Override
	public void send(String message) {
		service.sendMessage(client, message);
	}

	@Override
	public void onMessage(String message) {
		if(listener != null) {
			Event ev = new Event();
			ev.data = message;
			listener.onMessage(ev);
		}
	}

	@Override
	public void onClose(String reason) {
		if(listener != null) {
			listener.onClose(reason);
		}
	}

	@Override
	public void onError(String reason) {
		if(listener != null) {
			listener.onError(reason);
		}
	}

}