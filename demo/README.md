To start farm:
    1. node startFarm.js (Default is localhost, for more options use --help)
    (following ports are used: 9000 (webserver) , 8001 (websocket connection) and 8000 (PZH farm). You can change ports in webinos/pzp/lib/session_configuration.js)
    2. https://localhost/index.html (Login via Gmail or Yahoo)
    3. https://localhost/main.html provides following functionalities: addnewpzp, fetch user details, crashLogs, connected PZH and PZP information, and logout

To start pzp:
   1. node startPzp.js --pzh-host='localhost/HabibVirji' --context-code=<fetched via web interface> (This is your PZH Name created based on Open ID details)
   2. To specify different parameters check node startPzp.js --help

Configuration storage information:
    1. Configuration of certificate is stored in HOME_DIR/.webinos/config
    2. Logs are stored in HOME_DIR/.webinos/logs
    3. Keys are temp stored in HOME_DIR/.webinos/keys, need to put in KEY STORAGE
    4. To add PZH just login, once login details are stored in farm. If farm is restarted it restarts PZH too , You do not need to login again ...
    5. When starting PZP, you need to specify farm_address/<Your name in OpenId> e.g. localhost/HabibVirji (if in doubt check user details page to see your name, make sure about use case)
    6. Certificates are created based on openid details. 
    
 TODO ITEMS:
    1. PZH web interface associated with PZH, only one connection is handled currently. To support multiple users ..
    2. Change directory from where web server is initialized ..
    3. Allow only certain directories to be accessible
    4. Use write stream and pipe for storing keys and config
    5. Revoke Certificate
    6. Restart PZH
    
