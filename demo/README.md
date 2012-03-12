Please note: 
1. If PZP is not able to connect to PZH, check if your configuration file exists in HOME_DIR/.webinos/config/<pzp name>.json. Delete it and try again
2. Recompile code to get PZH - PZH connection, you will need to clean your config files in HOME_DIR/.webinos/config/ 

To start farm:
    1. node startFarm.js 
    2. https://localhost:9000/index.html (Login via Gmail or Yahoo)
    
 To change Port Numbers: 
    - Default is localhost, for more options use --help
    - following ports are used: 9000 (webserver) , 8001 (websocket connection) and 8000 (PZH farm). 
    - You can change ports in webinos/pzp/lib/session_configuration.js

To start pzp:
   1. node startPzp.js --pzh-host='localhost/HabibVirji' --context-code='code' --pzp-name=PC
   -- mandatory pzh-host is your PZH Name created based on Open ID details, if in doubt check on right handside the pzh name
   -- mandatory context-code is fetched via a web interface
   -- optional pzh-name is need if you need to start more than 1 pzp (if WebinosPzp is created, subsequent connection uses same file)

Configuration storage information:
    1. Configuration of certificate is stored in HOME_DIR/.webinos/config
    2. Logs are stored in HOME_DIR/.webinos/logs
    3. Keys are temp stored in HOME_DIR/.webinos/keys, need to put in KEY STORAGE
    4. To add PZH just login, once login details are stored in farm. If farm is restarted it restarts PZH too , You do not need to login again ...
    5. When starting PZP, you need to specify farm_address/<Your name in OpenId> e.g. localhost/HabibVirji (if in doubt check user details page to see your name, make sure about use case)
    6. Certificates are created based on openid details. 
    
 TODO ITEMS:
    6. Restart PZH - As PZH are SNI context, how to restart a PZH in a farm. 

    2. Change directory from where web server is initialized ..
    3. Allow only certain directories to be accessible
    4. Use write stream and pipe for storing keys and config