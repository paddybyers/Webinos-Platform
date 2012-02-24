package org.webinos.app.pzp;

import java.util.HashMap;

import org.meshpoint.anode.Isolate;
import org.meshpoint.anode.Runtime;
import org.meshpoint.anode.Runtime.IllegalStateException;
import org.meshpoint.anode.Runtime.InitialisationException;
import org.meshpoint.anode.Runtime.NodeException;
import org.meshpoint.anode.Runtime.StateListener;
import org.webinos.app.R;
import org.webinos.app.anode.AnodeService;
import org.webinos.app.platform.Config;
import org.webinos.app.platform.PlatformInit;

import android.app.Activity;
import android.content.Context;
import android.content.res.Resources;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

public class ConfigActivity extends Activity implements StateListener {
	private static String TAG = "org.webinos.app.pzp.ConfigActivity";
	private Context ctx;
	private Button startButton;
	private Button stopButton;
	private EditText pzpText;
	private EditText pzhText;
	private TextView stateText;
	private Handler viewHandler = new Handler();
	private long uiThread;
	private String instance;
	private Isolate isolate;

	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.pzp);
		ctx = getApplicationContext();
		PlatformInit.init(this);
		initUI();
		uiThread = viewHandler.getLooper().getThread().getId();
	}

	private void initUI() {
		Config config = Config.getInstance();
		startButton = (Button)findViewById(R.id.start_button);
		startButton.setOnClickListener(new StartClickListener());

		stopButton = (Button)findViewById(R.id.stop_button);
		stopButton.setOnClickListener(new StopClickListener());

		pzhText = (EditText)findViewById(R.id.args_pzhText);
		String pzh = config.getProperty("pzh.default");
		if(pzh != null)
			pzhText.setText(pzh);

		pzpText = (EditText)findViewById(R.id.args_pzpText);
		String pzp = config.getProperty("pzp.default");
		if(pzp != null)
			pzpText.setText(pzp);

		stateText = (TextView)findViewById(R.id.args_stateText);
		__stateChanged(Runtime.STATE_CREATED);
	}

	private void startAction() {
		HashMap<String, String> args = new HashMap<String, String>();
		args.put("pzh", pzhText.getText().toString());
		args.put("pzp", pzpText.getText().toString());
		String cmd = Config.getInstance().getProperty("pzp.cmd");
		for(String key : args.keySet())
			cmd = cmd.replace("%" + key, args.get(key));

		try {
			Runtime.initRuntime(this, new String[]{});
			isolate = Runtime.createIsolate();
			isolate.addStateListener(this);
			this.instance = AnodeService.addInstance(instance, isolate);
			isolate.start(cmd.split("\\s"));
		} catch (IllegalStateException e) {
			Log.v(TAG, "isolate start: exception: " + e + "; cause: " + e.getCause());
		} catch (NodeException e) {
			Log.v(TAG, "isolate start: exception: " + e);
		} catch (InitialisationException e) {
			Log.v(TAG, "runtime init: exception: " + e);
		}
	}

	private void stopAction() {
		if(instance == null) {
			Log.v(TAG, "AnodeReceiver.onReceive::stop: no instance currently running for this activity");
			return;
		}
		try {
			isolate.stop();
		} catch (IllegalStateException e) {
			Log.v(TAG, "isolate stop : exception: " + e + "; cause: " + e.getCause());
		} catch (NodeException e) {
			Log.v(TAG, "isolate stop: exception: " + e);
		}
	}

	class StartClickListener implements OnClickListener {
		public void onClick(View arg0) {
			startAction();
		}
	}

	class StopClickListener implements OnClickListener {
		public void onClick(View arg0) {
			stopAction();
		}
	}

	@Override
	public void stateChanged(final int state) {
		if(Thread.currentThread().getId() == uiThread) {
			__stateChanged(state);
		} else {
			viewHandler.post(new Runnable() {
				public void run() {
					__stateChanged(state);
				}
			});
		}
	}

	private void __stateChanged(final int state) {
		stateText.setText(getStateString(state));
		startButton.setEnabled(state == Runtime.STATE_CREATED);
		stopButton.setEnabled(state == Runtime.STATE_STARTED);
		/* exit the activity if the runtime has exited */
		if(state == Runtime.STATE_STOPPED) {
			finish();
		}
	}

	private String getStateString(int state) {
		Resources res = ctx.getResources();
		String result = null;
		switch(state) {
		case Runtime.STATE_CREATED:
			result = res.getString(R.string.created);
			break;
		case Runtime.STATE_STARTED:
			result = res.getString(R.string.started);
			break;
		case Runtime.STATE_STOPPING:
			result = res.getString(R.string.stopping);
			break;
		case Runtime.STATE_STOPPED:
			result = res.getString(R.string.stopped);
			break;
		}
		return result;
	}

}
