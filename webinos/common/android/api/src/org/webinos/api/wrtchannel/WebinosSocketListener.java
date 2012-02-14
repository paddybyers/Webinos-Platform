package org.webinos.api.wrtchannel;

public interface WebinosSocketListener {
	public void onMessage(Event ev);
	public void onClose(String reason);
	public void onError(String reason);
}
