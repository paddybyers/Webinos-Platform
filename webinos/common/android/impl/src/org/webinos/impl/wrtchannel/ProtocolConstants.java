package org.webinos.impl.wrtchannel;

public class ProtocolConstants {
	/* Message types between client and server */
	public static final int MSG_REGISTER   = 0;
	public static final int MSG_UNREGISTER = 1;
	public static final int MSG_CONNECT    = 2;
	public static final int MSG_DISCONNECT = 3;
	public static final int MSG_DATA       = 4;

    /* Conversions to put both message type and client Id in the what field */
	public static int toWhat(int msg, int id) { return msg + (id << 16); }
	public static int whatToMsg(int what) { return what & 0xffff; }
	public static int whatToId(int what) { return what >> 16; }
}
