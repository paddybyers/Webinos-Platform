 Important updated:
    1. Whole new code to handle session configuration
    2. Websocket server https intiailized
    3. Whole new directory structure
    4. First you need to start farm node startFarm.js. It by default starts on
    5. PZH WebServer starts at 443 (webserver) and 81 (websocket connection)
    6. To login you need to use openid. Only Google one is supported currently ..
    7. Current functionality includes addnewpzp, user details, connected PZH and PZP, and logout
    8. Configuration of certificate is stored in HOME_DIR/.webinos/config
    9. Logs are stored in HOME_DIR/.webinos/logs
    10. Keys are temp stored in HOME_DIR/.webinos/keys
    11. To add PZH just login, once login details are stored in farm. If farm is restarted it restarts PZH , You do not need to login again ...
    12. When starting PZP, you need to specify farm_address/<Your first name in OpenId> e.g. localhost/Habib
    13. Certificates are created based on openid details.
    
    Before update to main branch following functionality will be implemented.
    1. CrashLog
    2. Revoke Certificate
    3. Restart PZH
    4. Mandatory to specify pzp code, which can be obtain via PZH web interface while creating new PZP

