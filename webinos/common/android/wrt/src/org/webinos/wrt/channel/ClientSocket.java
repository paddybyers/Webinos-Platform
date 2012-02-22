package org.webinos.wrt.channel;

import java.io.IOException;
import java.util.HashSet;

import org.webinos.wrt.core.WidgetConfig;
import org.webinos.wrt.core.WrtManager;
import org.webinos.wrt.renderer.WebView;
import org.webinos.wrt.util.AssetUtils;


import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.util.Log;

public class ClientSocket {
	
    private static final String SOCKETJS_ASSET = "js/webinossocket.js";
    private static final String SERVICE_ID = "org.webinos.wrt.channel.SERVER";
    private static final String TAG = "org.webinos.wrt.channel.ClientSocket";

    private final WebView webView;
	private WidgetConfig widgetConfig;
	private String instanceId;
    private Messenger incomingHandler = null;
    private HashSet<String> ids = new HashSet<String>();

    private static Messenger remoteService = null;
    private static ServiceConnection connection = null;
    private static boolean bound = false;
    private static boolean registered = false;
    
    private static String escapeString(String text) {
    	StringBuffer buf = new StringBuffer();
    	for(int i = 0; i < text.length(); i++) {
    		char c = text.charAt(i);
    		switch(c) {
    		case '\'':
    			buf.append("\\\'");
    			break;
    		case '"':
    			buf.append("\\\"");
    			break;
    		case '\\':
    			buf.append("\\\\");
    			break;
    		case '\n':
    			buf.append("\\n");
    			break;
    		case '\r':
    			buf.append("\\r");
    			break;
    		case '\t':
    			buf.append("\\t");
    			break;
    		default:
    			buf.append(c);
    		}
    	}
    	return buf.toString();
    }
    
    public static void bind() {
    	connection = new ServiceConnection() {
            public void onServiceConnected(ComponentName className, IBinder service) {
            	remoteService = new Messenger(service);

                try {
                    Message msg = Message.obtain(null, ProtocolConstants.toWhat(ProtocolConstants.MSG_REGISTER));
                    remoteService.send(msg);
                    registered = true;
                } catch (RemoteException e) {
                    /* In this case the service has crashed before we could even
                     * do anything with it; we can count on soon being
                     * disconnected (and then reconnected if it can be restarted)
                     * so there is no need to do anything here. */
                }
            }

            public void onServiceDisconnected(ComponentName className) {
            	remoteService = null;
                bound = false;
            }
        };
        WrtManager.getInstance().bindService(new Intent(SERVICE_ID), connection, Context.BIND_AUTO_CREATE);
        bound = true;
    }

    public static void unbind() {
		if(bound) {
            if (remoteService != null) {
                try {
                    Message msg = Message.obtain(null, ProtocolConstants.toWhat(ProtocolConstants.MSG_UNREGISTER));
                    remoteService.send(msg);
                } catch (RemoteException e) {
                    /* There is nothing special we need to do if the service
                     * has crashed. */
                } finally {
                	registered = false;
                	remoteService = null;
                }
            }

            WrtManager.getInstance().unbindService(connection);
            bound = false;
		}
    }

	public ClientSocket(WebView webView, WidgetConfig widgetConfig, String instanceId) {
		this.webView = webView;
		this.widgetConfig = widgetConfig;
		this.instanceId = instanceId;
		try {
			webView.injectScript(AssetUtils.getAssetAsString(WrtManager.getInstance(), SOCKETJS_ASSET));
		} catch(IOException ioe) {
			Log.v(TAG, "Unable to inject " + SOCKETJS_ASSET + "; exception: ", ioe);
		}
	}

	public void dispose() {
		for(String id : ids)
			closeSocket(Integer.parseInt(id));
	}

	private void checkState() {
		if(!bound) {
			throw new RuntimeException("Attempt to use socket before bind");
		}
		if(!registered) {
			throw new RuntimeException("Attempt to use socket before registered");
		}
	}

	public void openSocket(final int id) {
    	Log.v(TAG, "openSocket()");
    	checkState();
    	incomingHandler = new Messenger(new Handler() {
            @Override
            public void handleMessage(Message msg) {
            	Log.v(TAG, "handleMessage: msg: " + msg.toString());
                switch (ProtocolConstants.whatToMsg(msg.what)) {
                case ProtocolConstants.MSG_DISCONNECT:
                	Log.v(TAG, "IncomingHandler: disconnect");
                	break;
                case ProtocolConstants.MSG_DATA:
                	Log.v(TAG, "IncomingHandler: data");
                	String data = ((Bundle)msg.obj).getString("data");
                	Log.v(TAG, "IncomingHander: data: " + data);
                	int id = ProtocolConstants.whatToId(msg.what);
                    webView.callScript("WebinosSocket.handleMessage(" + id + ", '" +  escapeString(data) + "');");
                	break;
               default:
                    super.handleMessage(msg);
                }
            	Log.v(TAG, "handleMessage: ret");
            }
    	});

        try {
        	Log.v(TAG, "sending connect message");
        	Bundle clientDetails = new Bundle();
        	clientDetails.putString("instanceId", instanceId);
        	clientDetails.putString("installId", widgetConfig.getInstallId());
            Message msg = Message.obtain(null, ProtocolConstants.toWhat(ProtocolConstants.MSG_CONNECT, id), clientDetails);
            msg.replyTo = incomingHandler;
            remoteService.send(msg);
            ids.add(String.valueOf(id));
            webView.callScript("WebinosSocket.handleConnect(" + id + ");");
        } catch (RemoteException e) {
        	throw new RuntimeException("Exception opening socket", e);
        }
	}

	public void closeSocket(int id) {
    	checkState();
        try {
            Message msg = Message.obtain(null, ProtocolConstants.toWhat(ProtocolConstants.MSG_DISCONNECT, id));
            msg.replyTo = remoteService;
            remoteService.send(msg);
        } catch (RemoteException e) {
        	throw new RuntimeException("Exception closing socket", e);
        }
	}

	public void send(int id, String message) {
    	checkState();
        try {
        	Bundle messageBundle = new Bundle();
        	messageBundle.putString("data", message);
            Message msg = Message.obtain(null, ProtocolConstants.toWhat(ProtocolConstants.MSG_DATA, id), messageBundle);
            remoteService.send(msg);
        } catch (RemoteException e) {
        	throw new RuntimeException("Exception sending on socket", e);
        }
	}
}
