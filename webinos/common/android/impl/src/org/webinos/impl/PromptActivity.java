package org.webinos.impl;

import android.content.Context;
import android.util.Log;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.DialogInterface;
import android.os.Bundle;


public class PromptActivity extends Activity {

	private static final String LABEL = "org.webinos.impl.PromptActivity";
	Context ctx;

	@Override
	public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ctx = getApplicationContext();
        this.getWindow().getDecorView().setBackgroundColor(0xFFFFFFFF);
		Log.v(LABEL, "onCreate");
		try {
			String message = null;
			String[] choice = null;
			
			Bundle extras = getIntent().getExtras();
			if(extras!=null) {
				message = extras.getString("org.webinos.impl.PromptImpl.message");
				choice = extras.getStringArray("org.webinos.impl.PromptImpl.choice");
			}
			
			AlertDialog.Builder builder = new AlertDialog.Builder(this);
			DialogInterface.OnClickListener response = new DialogInterface.OnClickListener(){
				public void onClick(DialogInterface dialog, int id) {
					Log.v(LABEL, "onCreate - choice is "+id);
					sendResult(id);
				}
			};

			builder.setTitle(message);
			builder.setCancelable(false);
			builder.setItems(choice, response);
			AlertDialog alert = builder.create();
			alert.show();
		}
		catch(Exception e) {
			Log.v(LABEL, "onCreate - exception "+e.getMessage());
			sendResult(-1);
		}
	}

	private void sendResult(int code) {
		Log.v(LABEL, "sendResult");
		Intent intent = new Intent("org.webinos.impl.PromptImpl.PROMPT_RESPONSE");
		intent.putExtra("response", code);
		ctx.sendBroadcast(intent);
		finish();
	}

}
