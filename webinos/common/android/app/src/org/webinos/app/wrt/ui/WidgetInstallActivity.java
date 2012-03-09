package org.webinos.app.wrt.ui;

import org.webinos.app.R;
import org.webinos.app.wrt.mgr.PrepareCallback;
import org.webinos.app.wrt.mgr.ProcessingResult;
import org.webinos.app.wrt.mgr.WidgetConfig;
import org.webinos.app.wrt.mgr.WidgetManagerImpl;
import org.webinos.app.wrt.mgr.WidgetManagerService;

import android.app.Activity;
import android.app.Dialog;
import android.app.ProgressDialog;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;

public class WidgetInstallActivity extends Activity {
	
	private static final int INSTALL_PROGRESS_DIALOG = 1;
	private static final String TAG = "org.webinos.app.wrt.ui.WidgetInstallActivity";
	
	private int shownDialog = -1;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		final WidgetManagerImpl widgetMgr = WidgetManagerService.getInstance();
		if(widgetMgr == null)
			throw new RuntimeException("WidgetInstallActivity.onCreate(): unable to get WidgetManager");

		Bundle extras = getIntent().getExtras();
		if(extras == null)
			throw new RuntimeException("WidgetInstallActivity.onCreate(): unable to get Intent extras");

		final String[] wgtPaths = extras.getStringArray("path");
		
		final PrepareCallback listener = new PrepareCallback() {
			@Override
			public void onPrepareComplete(ProcessingResult processingResult) {
				if(processingResult.status != WidgetConfig.STATUS_OK) {
					Log.e(TAG, "WidgetInstallActivity: unable to install: code: " + processingResult.error.code + "; reason: " + processingResult.error.reason);
					if(processingResult.widgetConfig != null && processingResult.widgetConfig.installId != null) {
						widgetMgr.abortInstall(processingResult.widgetConfig.installId);
					}
				} else {
					/* FIXME: add install prompt */
					widgetMgr.completeInstall(processingResult.widgetConfig.installId);
				}
			}
		};

		(new AsyncTask<String[], Void, String>() {
			@Override
			protected void onPreExecute() {
				showDialog(shownDialog = INSTALL_PROGRESS_DIALOG);
			}

			@Override
			protected String doInBackground(String[]... params) {
				final String[] wgtPaths = params[0];
				for(String wgtPath : wgtPaths)
					widgetMgr.prepareInstall(wgtPath, null, listener);
				return null;
			}

			@Override
			protected void onPostExecute(String result) {
				if(shownDialog != -1)
					dismissDialog(shownDialog);
				setResult(Activity.RESULT_OK);
				finish();
			}
		}).execute(wgtPaths);
	}

	@Override
	protected Dialog onCreateDialog(int id) {
		if(id == INSTALL_PROGRESS_DIALOG) {
			ProgressDialog progressDialog = new ProgressDialog(this);
			progressDialog.setMessage(getString(R.string.installing_widget));
			return progressDialog;
		}
		return super.onCreateDialog(id);
	}
}
