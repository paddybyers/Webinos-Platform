 Important information:
    1. First you need to start farm node startFarm.js. It by default starts on 8000 port
    2. PZH FARM WebServer starts at 443 (webserver) and 81 (websocket connection). These values are coded in webinos/pzp/lib/session_configuration.js.
    3. Login is via openid. Only Google one is supported currently ..
    4. Current functionality includes addnewpzp, user details, crashLogs, connected PZH and PZP, and logout
    5. Configuration of certificate is stored in HOME_DIR/.webinos/config
    6. Logs are stored in HOME_DIR/.webinos/logs
    7. Keys are temp stored in HOME_DIR/.webinos/keys, need to put in KEY STORAGE 
    8. To add PZH just login, once login details are stored in farm. If farm is restarted it restarts PZH too , You do not need to login again ...
    9. When starting PZP, you need to specify farm_address/<Your first name in OpenId> e.g. localhost/Habib
    10. Certificates are created based on openid details.
    
    Before update to main branch following functionality will be implemented.
    1. crash logs - done
    2. Mandatory to specify pzp code, which can be obtain via PZH web interface - @john: startPzh misses out = that is why these keep failing. We need to first fix this
    3. PZH web interface associated with PZH - done
    4. Yahoo and openid, github credentials support ...
    5. Update connected pzp and pzh information as new entities join in
    6. Change directory from where web server is initialized ..
    7. Allow only certain directories to be accessible
    8. Use write stream and pipe
    9. Revoke Certificate
    10. Restart PZH
    11. change config file to writestream. too frequent write happening 
