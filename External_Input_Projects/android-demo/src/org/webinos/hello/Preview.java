package org.webinos.pzp;

import java.io.FileNotFoundException;
import java.io.OutputStream;
import java.io.IOException;
import java.util.List;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Bitmap;
import android.hardware.Camera;
import android.hardware.Camera.PreviewCallback;
import android.util.Log;
import android.view.SurfaceHolder;
import android.view.SurfaceView;


import android.hardware.Camera.*;  
  
// CameraPreview Activity handled elsewhere
     
  
class Preview extends SurfaceView implements SurfaceHolder.Callback, PreviewCallback
{  
  MainActivity activity;
  SurfaceHolder holder;  
  Camera camera;
  boolean paused = false; 
  
  //This variable is responsible for getting and setting the camera settings  
  private Parameters parameters;  
  //this variable stores the camera preview size  
  private Size previewSize;  
  //this array stores the pixels as hexadecimal pairs  
  private int[] pixels;  
  
  Preview(MainActivity activity)
  {  
    super(activity);
    this.activity = activity;
    paused = false; 
  
    // Install a SurfaceHolder.Callback so we get notified when the  
    // underlying surface is created and destroyed.  
    holder = getHolder();  
    holder.addCallback(this);  
    holder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);  
  }

  public void suspend()
  {
    camera.stopPreview();
    paused = true;
  }

  public void resume()
  {
    if (paused)
      camera.startPreview();

    paused = false;
  }

  public void sendFrame(OutputStream out)
  {
    // stop preview to ensure we get complete frame
    camera.stopPreview();

    // create a bitmap object from the pixel data
    Bitmap bmp = Bitmap.createBitmap(pixels, previewSize.width,
                       previewSize.height, Bitmap.Config.ARGB_8888);

    // and convert to jpg and post to stream
    bmp.compress(Bitmap.CompressFormat.JPEG, 100, out);

    // restart preview after sending the frame
    camera.startPreview();
  }

  private Camera openFrontFacingCameraGingerbread() throws RuntimeException
  {
    int cameraCount = 0;
    Camera camera = null;
    Camera.CameraInfo cameraInfo = new Camera.CameraInfo();
    cameraCount = Camera.getNumberOfCameras();

    for (int camIdx = 0; camIdx < cameraCount; camIdx++)
    {
      Camera.getCameraInfo( camIdx, cameraInfo );

      if (cameraInfo.facing == Camera.CameraInfo.CAMERA_FACING_FRONT)
        camera = Camera.open(camIdx);
    }
 
    return camera;
  } 
  
  public void surfaceCreated(SurfaceHolder holder)
  {  
    // The Surface has been created, acquire the camera
    // and tell it where to draw.  
    try
    {  
      //camera = Camera.open();
      camera = openFrontFacingCameraGingerbread();
      camera.setDisplayOrientation(90);
      camera.setPreviewDisplay(holder);  
  
      //sets the camera callback to be the one defined in this class  
      camera.setPreviewCallback(this);
  
      ///initialize the variables  
      parameters = camera.getParameters();  
      previewSize = parameters.getPreviewSize();  
      pixels = new int[previewSize.width * previewSize.height];  
  
    }
    catch (RuntimeException e)
    {
      camera = null;
      // Couldn't open camera 
      activity.logException("couldn't open camera", e); 
    }  
    catch (IOException e)
    {  
      camera.release();  
      camera = null;  
      activity.logException("error in surfaceCreated", e); 
    }  
  }  
  
  public void surfaceDestroyed(SurfaceHolder holder)
  {  
    // Surface will be destroyed when we return, so stop the preview.  
    // Because the CameraDevice object is not a shared resource, it
    // is very important to release it when pausing the activity
    try
    { 
      camera.stopPreview();  
      camera.release();  
      camera = null;
      activity.log("camera released");
    }
    catch (Exception e)
    {
      activity.logException("error in surfaceDestroyed", e); 
    }
  }  
  
  public void surfaceChanged(SurfaceHolder holder, int format, int w, int h)
  {
    try
    {
      // Now that the size is known, set up the
      // camera parameters and begin the preview.  
      // parameters.setPreviewSize(352, 258);
      previewSize = parameters.getPreviewSize();  
      parameters.setPreviewSize(previewSize.width, previewSize.height);
      // set the camera's settings  
      camera.setParameters(parameters);  
      camera.startPreview();  
    }
    catch (Exception e)
    {
      activity.logException("error in surfaceChanged", e); 
    }
  }  
  
  @Override  
  public void onPreviewFrame(byte[] data, Camera camera)
  {
    // transforms NV21 pixel data into RGB pixels  
    decodeYUV420SP(pixels, data, previewSize.width,  previewSize.height);  
  }  
  
  // Method from Ketai project! Not mine! See below...  
  void decodeYUV420SP(int[] rgb, byte[] yuv420sp, int width, int height)
  {  
    final int frameSize = width * height;  
  
    for (int j = 0, yp = 0; j < height; j++)
    {
      int uvp = frameSize + (j >> 1) * width, u = 0, v = 0;  

      for (int i = 0; i < width; i++, yp++)
      {  
        int y = (0xff & ((int) yuv420sp[yp])) - 16;  

        if (y < 0)  
          y = 0;  

        if ((i & 1) == 0)
        {  
          v = (0xff & yuv420sp[uvp++]) - 128;  
          u = (0xff & yuv420sp[uvp++]) - 128;  
        }  
  
        int y1192 = 1192 * y;  
        int r = (y1192 + 1634 * v);  
        int g = (y1192 - 833 * v - 400 * u);  
        int b = (y1192 + 2066 * u);  
  
        if (r < 0)
          r = 0;
        else if (r > 262143)  
          r = 262143;  
        if (g < 0)
          g = 0;
        else if (g > 262143)  
          g = 262143;  

        if (b < 0)
          b = 0;
        else if (b > 262143)  
          b = 262143;  
  
        rgb[yp] = 0xff000000 | ((r << 6) & 0xff0000) | ((g >> 2) & 0xff00) | ((b >> 10) & 0xff);  
      }  
    }  
  }  
}
