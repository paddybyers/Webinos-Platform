/*******************************************************************************
*  Code contributed to the webinos project
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*  
*     http://www.apache.org/licenses/LICENSE-2.0
*  
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* 
* Copyright 2012 Sony Mobile Communications
* 
******************************************************************************/

package org.webinos.api.sensor;

import org.meshpoint.anode.idl.Dictionary;

@SuppressWarnings("serial")
public class SensorError extends RuntimeException implements Dictionary {

    public static final int INVALID_INPUT_ARGUMENT = 0;
    public static final int UNKNOWN_ERROR = 0;
    public static final int TIMEOUT_ERROR = 1;
    public static final int ILLEGAL_SENSOR_TYPE_ERROR = 2;
    public static final int SENSOR_TYPE_NOT_SUPPORTED_ERROR = 3;
    public static final int ILLEGAL_SENSOR_ID_ERROR = 4;
    public static final int OTHER_ILLEGAL_INPUT_ARGUMENT_ERROR = 5;
    public static final int REQUESTED_RATE_NOT_SUPPORTED_ERROR = 6;
    public static final int REQUESTED_INTERRUPTMODE_NOT_SUPPORTED_ERROR = 7;
    public static final int PERMISSION_DENIED_ERROR = 50;

    public int code;

}
