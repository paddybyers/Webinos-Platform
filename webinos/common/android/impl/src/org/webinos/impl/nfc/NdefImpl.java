package org.webinos.impl.nfc;

import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;
import org.webinos.api.SuccessCallback;
import org.webinos.api.nfc.NFCTagTechnologyNdef;
import org.webinos.api.nfc.NdefMessage;
import org.webinos.api.nfc.NdefSuccessCallback;
import org.webinos.api.nfc.NfcError;

public class NdefImpl extends NFCTagTechnologyNdef {

	@Override
	public PendingOperation makeReadOnly(SuccessCallback successCallback,
			ErrorCallback errorCallback) throws NfcError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public NdefMessage readCachedNdefMessage() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public PendingOperation readNdefMessage(
			NdefSuccessCallback successCallback, ErrorCallback errorCallback)
			throws NfcError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public PendingOperation writeNdefMessage(SuccessCallback successCallback,
			ErrorCallback errorCallback, NdefMessage message) throws NfcError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public NdefMessage createNdefMessage() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void connect() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void close() {
		// TODO Auto-generated method stub
		
	}

}
