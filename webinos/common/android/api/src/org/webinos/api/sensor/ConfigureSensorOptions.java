package org.webinos.api.sensor;

public class ConfigureSensorOptions {
    public static final int INFINITE = 0;
    public static final int SENSOR_DELAY_FASTEST = 0;
    public static final int SENSOR_DELAY_GAME = 1;
    public static final int SENSOR_DELAY_UI = 2;
    public static final int SENSOR_DELAY_NORMAL = 3;
    public static final int SENSOR_DELAY_UNDEFINED = 100;

    public int timeout;
    public int rate;
    public boolean interrupt;
}
