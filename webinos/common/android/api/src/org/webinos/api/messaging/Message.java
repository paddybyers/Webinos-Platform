package org.webinos.api.messaging;

import java.util.Date;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;
import org.webinos.api.DeviceAPIError;
import org.webinos.api.ErrorCallback;
import org.webinos.api.File;
import org.webinos.api.PendingOperation;

public abstract class Message extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByName(Message.class.getName());
	protected Message() { super(iface); }

	public String id;
	public int type; 
	public int folder;
	public Date timestamp;
	public String from;
	public String[] to;
	public String[] cc;
	public String[] bcc;
	public String body;
	public boolean isRead;
	public boolean priority;
	public String subject;
	public File[] attachments;
	
    public abstract PendingOperation update(UpdateMessageSuccessCallback successCallback, ErrorCallback errorCallback) throws DeviceAPIError;
}
