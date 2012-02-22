package org.webinos.app.wrt.ui;

import org.webinos.app.wrt.mgr.WidgetManagerImpl;
import org.webinos.app.wrt.mgr.WidgetManagerService;
import org.webinos.app.R;

import android.app.Activity;
import android.app.Dialog;
import android.app.ProgressDialog;
import android.os.AsyncTask;
import android.os.Bundle;

public class WidgetUninstallActivity extends Activity {

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		final WidgetManagerImpl widgetMgr = WidgetManagerService.getInstance();
		if(widgetMgr == null)
			throw new RuntimeException("WidgetUninstallActivity.onCreate(): unable to get WidgetManager");

		Bundle extras = getIntent().getExtras();
		if(extras == null)
			throw new RuntimeException("WidgetUninstallActivity.onCreate(): unable to get Intent extras");

		final String installId = extras.getString("installId");

		(new AsyncTask<String, Void, String>() {
			@Override
			protected void onPreExecute() {
				showDialog(0);
			}

			@Override
			protected String doInBackground(String... params) {
				final String installId = params[0];
				widgetMgr.uninstall(installId);
				return installId;
			}

			@Override
			protected void onPostExecute(String result) {
				dismissDialog(0);
				setResult(Activity.RESULT_OK);
				finish();
			}
		}).execute(installId);
	}

	@Override
	protected Dialog onCreateDialog(int id) {
		if(id != 0)
			return super.onCreateDialog(id);
		ProgressDialog progressDialog = new ProgressDialog(this);
		progressDialog.setMessage(getString(R.string.uninstalling_widget));
		return progressDialog;
	}
}
