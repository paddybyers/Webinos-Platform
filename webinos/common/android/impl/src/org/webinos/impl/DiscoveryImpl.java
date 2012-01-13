package org.webinos.impl;

import java.util.Set;
import java.util.ArrayList;
import android.util.Log;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;

import org.webinos.api.PendingOperation;
import org.webinos.api.discovery.DiscoveryManager;
import org.webinos.api.discovery.Filter;
import org.webinos.api.discovery.FindCallback;
import org.webinos.api.discovery.Options;
import org.webinos.api.discovery.Service;
import org.webinos.api.discovery.ServiceType;
import org.webinos.api.discovery.DiscoveryError;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothClass;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

public class DiscoveryImpl extends DiscoveryManager implements IModule {
	
	private Context androidContext;
    private BluetoothAdapter mBluetoothAdapter;
	
    private static final String TAG = "org.webinos.impl.DiscoveryImpl";
    private static final boolean D = true;
    
    Set<BluetoothDevice> devicesAvailable = null; 
    Set<BluetoothDevice> devicesFound = null; 
	/*****************************
	 * DiscoveryManager methods
	 *****************************/
	@Override
	public synchronized PendingOperation findServices(
			ServiceType serviceType,
			FindCallback findCallback,
			Options options, 
			Filter filter)   
	{
		if(D) Log.v(TAG, "DiscoveryImpl: findservices");
		
		if(serviceType == null) {
			Log.e(TAG, "DiscoveryImpl: Please specify a serviceType");
			return null;
		}
		
		DiscoveryRunnable bluetoothFindService = new BluetoothFindService(serviceType, findCallback, options, filter);
		Thread t = new Thread(bluetoothFindService);
		t.start();
		
		Log.v(TAG, "findServices - thread started with id "+(int)t.getId());
		DiscoveryPendingOperation pOp = new DiscoveryPendingOperation();
		pOp.setData(t, bluetoothFindService);
		return pOp;
	}
	
	public String getServiceId(String serviceType){
		// TODO Auto-generated method stub - this probably is not applicable for BT discovery
		return null; 
	 }
	
	public Service createService(){
		// TODO Auto-generated method stub - this probably is not applicable for BT discovery
		return null;
	}
	
	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {

		if(D) Log.v(TAG, "DiscoveryImpl: startModule");
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		
		 mBluetoothAdapter = getDefaultBluetoothAdapter();
		
		if (mBluetoothAdapter == null) {
			if(D) Log.e(TAG, "Bluetooth is not available");
			return null;
		}
        else{
        	if (!mBluetoothAdapter.isEnabled()){ 
        		if(D) Log.d(TAG, "Bluetooth is not enabled");
        		// TODO start UI activity to enable Bluetooth
        		return null;
        	}
        	else
        	{
        		Log.d(TAG, "Found Bluetooth adapter");
        		return this;
        	}
        } 
	}
	
	@Override
	public void stopModule() {
		/*
		 * perform any module shutdown here ...
		 */
		Log.v(TAG, "DiscoveryImpl: stopModule");
	}
	
	/*****************************
	 * Helpers
	 *****************************/
	  private static BluetoothAdapter getDefaultBluetoothAdapter() {
		    // Check if the calling thread is the main application thread,
		    // if it is, do it directly.
		    if (Thread.currentThread().equals(Looper.getMainLooper().getThread())) {
		    	Log.v(TAG, "main thread - get bluetooth");
		      return BluetoothAdapter.getDefaultAdapter();
		    }
		    
		    // If the calling thread, isn't the main application thread,
		    // then get the main application thread to return the default adapter.
		    final ArrayList<BluetoothAdapter> adapters = new ArrayList<BluetoothAdapter>(1);
		    final Object mutex = new Object();
		    
		    Handler handler = new Handler(Looper.getMainLooper());
		    handler.post(new Runnable() {
		      @Override
		      public void run() {
		    	  Log.e(TAG, "not main thread");
		        adapters.add(BluetoothAdapter.getDefaultAdapter());
		        synchronized (mutex) {
		          mutex.notify();
		        }
		      }
		    });
		    
		    while (adapters.isEmpty()) {
		    	  Log.e(TAG, "adapter is empty");
			        
		      synchronized (mutex) {
		        try {
		          mutex.wait(1000L);
		        } catch (InterruptedException e) {
		          Log.e(TAG, "Interrupted while waiting for default bluetooth adapter", e);
		        }
		      }
		    }
		    
		    if (adapters.get(0) == null) {
		    	 Log.e(TAG, "No bluetooth adapter found!");
		    }
		    return adapters.get(0);
		  }

	abstract interface DiscoveryRunnable extends Runnable {
		
		//for supports on PendingOperation
		public abstract void stop();
		public abstract boolean isStopped();
	}
	
 	class BluetoothFindService implements DiscoveryRunnable {

		private ServiceType serviceType;
		private FindCallback findCallBack;
	//	private Options options;
	//	private Filter filter;
		
		private DiscoveryReceiver mReceiver;
		private boolean stopped;
		
		private BluetoothFindService(ServiceType srvType,
				FindCallback findCB,
				Options opts, 
				Filter fltr) {
			serviceType = srvType;
			findCallBack = findCB;
		//	options = opts;
		//	filter = fltr;
			stopped = false;
			mReceiver = new DiscoveryReceiver(serviceType, findCallBack, this);
			if(D) Log.v(TAG,"constructed BluetoothFindService");
		}
		
		public synchronized boolean isStopped() {
			return stopped;
		}

		public synchronized void stop() {
			stopped = true;
		}
			
		public void run() {
//			Looper.prepare();
		// If we're already discovering, stop it
		if(D) Log.e(TAG,"runnable -run1");
        /*if (mBluetoothAdapter.isDiscovering()) 
        	mBluetoothAdapter.cancelDiscovery(); */
        
        // Request discover from BluetoothAdapter
        mBluetoothAdapter.startDiscovery();
		if(D) Log.e(TAG,"runnable -run2");

        if(stopped)
        	return;
        
        IntentFilter ifilter = new IntentFilter(BluetoothDevice.ACTION_FOUND);
        androidContext.registerReceiver(mReceiver, ifilter);

        // Register for broadcasts when discovery has finished
        ifilter = new IntentFilter(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
        androidContext.registerReceiver(mReceiver, ifilter);
  //      Looper.loop();
		}
		public void discoveryFinished() {
			androidContext.unregisterReceiver(mReceiver);
	   }
 	}
	 
 	class DiscoveryReceiver extends BroadcastReceiver {
		private ServiceType serviceType;
		private FindCallback findCallBack;  
		BluetoothFindService bluetoothFindService;
		
		private DiscoveryReceiver(ServiceType srvType,
				FindCallback findCB,
				BluetoothFindService btFnd) {
			serviceType = srvType;
			findCallBack = findCB;
			bluetoothFindService = btFnd;
		}
			
       @Override
       public void onReceive(Context context, Intent intent) {
    	   
    	   if(bluetoothFindService.isStopped()) {
				Log.v(TAG, "DiscoveryReceiver onReceive - stopped");
				return;
			}
           String action = intent.getAction();
           
           // When discovery finds a device
           if (BluetoothDevice.ACTION_FOUND.equals(action)) {
        	   // Get the BluetoothDevice object from the Intent
               BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
               devicesAvailable.add(device);  
           }
        // When device discovery is finished, query services
           else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action)) {
				//unregister receiver
				bluetoothFindService.discoveryFinished();

   			switch(getResultCode()) {
				case Activity.RESULT_OK:
					Log.d(TAG, "discovery Okay" +getResultCode());
			       	//get the list of bonded devices
		        	   Set<BluetoothDevice> devicesPaired = mBluetoothAdapter.getBondedDevices();
		        	   if (devicesPaired.isEmpty() && devicesAvailable.isEmpty())
		        		   Log.e(TAG, "No bluetooth device is available");
		        	   else{
		            	   if (!devicesAvailable.isEmpty()) {
		    	        	   for (BluetoothDevice device : devicesAvailable) {
		    	        		   BluetoothClass bluetoothClass = device.getBluetoothClass();
		    	        		   if ((bluetoothClass != null) && (bluetoothClass.hasService(Integer.parseInt(serviceType.api))))
		    	        			   devicesFound.add(device);
		    	        	   	}
		    	           }
		            	   if(!devicesPaired.isEmpty()) {
		    	        	   for (BluetoothDevice device : devicesPaired) {
		    	        		   BluetoothClass bluetoothClass = device.getBluetoothClass();
		    	        		   if ((bluetoothClass != null) && (bluetoothClass.hasService(Integer.parseInt(serviceType.api)))) 
		                           		devicesFound.add(device); 
		    	        	   }
		    	           }
		        	   }
		           
		           String[] deviceNames;
		           deviceNames = new String[devicesFound.size()];
		           String[] deviceAddresses;
		           deviceAddresses = new String[devicesFound.size()];
		           int i = 0;
		           for (BluetoothDevice device : devicesFound) {
		        	   deviceNames[i] = device.getName();
		        	   deviceAddresses[i] = device.getAddress(); 
		        	   i++;
		        	   System.out.println("device: " + i );
		        	   System.out.println("Name:" + deviceNames[i]);
		        	   System.out.println("Address:" + deviceAddresses[i]);
		           }
		           Service service = null;
		           service.api = serviceType.api;
		           //need to double check the follows -		           
		           findCallBack.onFound(service);
		           
	       	break;
			default:
					Log.d(TAG, "discovery failed" +getResultCode());
					findCallBack.onError(new DiscoveryError());
					break;
				}
	       }
	    }
   };    
   
   class DiscoveryPendingOperation extends PendingOperation {

		private Thread t=null;
		private DiscoveryRunnable r=null;
		
		public void setData(Thread t, DiscoveryRunnable r) {
			this.t = t;
			this.r = r;
		}
		
		public void cancel() {
			Log.d(TAG, "DiscoveryPendingOperation cancel");
			if(t!=null) {
				Log.v(TAG, "DiscoveryPendingOperation cancel - send interrupt...");
				//Is this interrupt needed??? - copied from messaging
				t.interrupt();
				if(r!=null)
					r.stop();
			}
		}

	}
   
}
