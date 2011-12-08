package org.webinos.api.nfc;

import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;
import org.webinos.api.SuccessCallback;

public abstract class NFCTagTechnologyNdef extends NFCTagTechnology {

	public static final int NDEFTYPE_OTHERS = 0;
	public static final int NDEFTYPE_NFCFORUMTYPE1 = 1;
	public static final int NDEFTYPE_NFCFORUMTYPE2 = 2;
	public static final int NDEFTYPE_NFCFORUMTYPE3 = 3;
	public static final int NDEFTYPE_NFCFORUMTYPE4 = 4;
	public static final int NDEFTYPE_MIFARECLASSIC = 5;
	
	public int ndefType;
	public boolean isWritable;
	public int maxNdefMessageSize;
	
	public abstract PendingOperation makeReadOnly(SuccessCallback successCallback, ErrorCallback errorCallback)
	        throws NfcError;
	
	public abstract NdefMessage readCachedNdefMessage();
	
	public abstract PendingOperation readNdefMessage(NdefSuccessCallback successCallback, ErrorCallback errorCallback)
	        throws NfcError;
	
	public abstract PendingOperation writeNdefMessage(SuccessCallback successCallback, ErrorCallback errorCallback, NdefMessage message)
	        throws NfcError;
	
	public abstract NdefMessage createNdefMessage();
}
