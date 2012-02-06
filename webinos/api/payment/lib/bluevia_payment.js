    /**
     * The Payment connector to BlueVia Payment API: https://bluevia.com/en/knowledge/APIs.API-Guides.Payment
     *
     */
    BlueViaConnect = function (customerID, shopID) {
      /* retrieving request token  from BlueVia Payment API */
      // built 
      sha1= require('./sha1');
      http= require('http');
      https= require('https');
           
      now = new Date();
      
      var oauthParameters= {
       "oauth_callback": "oob",
       "oauth_consumer_key": "kn12011684494805",
       "oauth_nonce": BlueVia_nonce(32),
       "oauth_signature_method": "HMAC-SHA1",
       "oauth_timestamp": ""+Math.floor(now.getTime()/1000),
       "xoauth_apiName": "Payment"
      };

     var paymentBody = "paymentInfo.amount=199&paymentInfo.currency=EUR&serviceInfo.name=webinosPaymentTest1&serviceInfo.serviceID=cc9171216b9854493e488191b988c3f0";
      
      // form initial signature base
      signatureBase="POST&"+BlueVia_percentEncode("https://api.bluevia.com/services/REST/Oauth/getRequestToken")+"&";

      var oauthParameters_fullset = new Array();
      
      // copy all parameters from oauthParameters header set
      for(var key in oauthParameters) 
         oauthParameters_fullset[key]=oauthParameters[key];
         
      // add all parameters from pseudo-URL parameter string
       oauthParameters_fullset["paymentInfo.amount"]="199";
       oauthParameters_fullset["paymentInfo.currency"]= "EUR";
       oauthParameters_fullset["serviceInfo.name"]= "webinosPaymentTest1";
       oauthParameters_fullset["serviceInfo.serviceID"]= "cc9171216b9854493e488191b988c3f0";
 
      
      // sort oauth parameters for signature base
      paramkeyarray = new Array();
      ind=0;
      for(var key in oauthParameters_fullset ) paramkeyarray[ind++]=key;
       paramkeyarray.sort();
      // add oauth parameters to signature base
      for(var i=0; i<paramkeyarray.length;i++) {
             var value= oauthParameters_fullset[paramkeyarray[i]];             
          console.log("Signature base line is " + paramkeyarray[i] + " : "+value);
             signatureBase=signatureBase+ BlueVia_percentEncode(paramkeyarray[i]+"="+value);
             
             if(i!=paramkeyarray.length-1)signatureBase=signatureBase+ BlueVia_percentEncode("&");
             //else signatureBase=signatureBase+ "&";
          }

       console.log("Signature base is now:" + signatureBase);
             
       var signature = BlueVia_createSignature("vZHl24249102"+"&",signatureBase);

       oauthParameters["oauth_signature"]=signature;

       console.log("Signature is" + signature);

       //var signatureTest = BlueVia_createSignature("1291818661092&",
      //"POST&https%3A%2F%2Fapi.bluevia.com%2Fservices%2FREST%2FOauth%2FgetRequestToken&oauth_callback%3Dhttps%253A%252F%252Fmydomain.com%252FOAuthCallback%26oauth_consumer_key%3DGjqq11099SE%26oauth_nonce%3D1291896949558-2241715991997156337%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1291896949");
      // console.log("SignatureTest is" + signatureTest);



      var headers1 = {
        'Authorization' : BlueVia_makeOAuth (oauthParameters),
        'Host': 'api.bluevia.com:443',
        'Content-Type': 'application/x-www-form-urlencoded'
     };
         
        var options = {
    host:'api.bluevia.com',
    port:'443',
    path: '/services/REST/Oauth/getRequestToken',
    method: 'POST',
    headers: headers1
  };

       var request = https.request(options, function (response) {
    response.on("data", function (chunk) {
       console.log("DATA: " + chunk);
     
    });
    response.on("close", function (err) {
      if( allowEarlyClose ) {
      console.log("EARLY CLOSE " + err);
        //passBackControl( response, result );
      }
    });
    response.addListener("end", function () {
       console.log("EARLY END " + response);
      //passBackControl( response, result );
    });
  });
  request.on('error', function(e) {
    console.log("ERROR CALLBACK$ " + e );
  });
  
   request.write(paymentBody);
   request.end();
            
       /*                 
        var site = https.createClient(443, 'api.bluevia.com', "POST", "/services/REST/Oauth/getRequestToken", headers, true);
        var request = site.request("POST", "/services/REST/Oauth/getRequestToken", headers)
        
        request.write(paymentBody);
        request.end();
     

        request.on('response', function(response) {
                    response.setEncoding('utf8');
                    console.log('STATUS: ' + response.statusCode);
                    response.on('data', function(chunk) {
                            console.log("DATA: " + chunk);
                    });
            });
            
       */     
     
    };
    
     BlueVia_nonce = function(nsize) {
      var result_nonce = "";
      nonce_chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < nsize; i++) {
          char_pos= Math.floor(Math.random() * 62);
          result_nonce=result_nonce+nonce_chars.charAt(char_pos);
       }      
       return result_nonce;
    }
    

     BlueVia_makeOAuth = function(OAparms) {
      var resultOA ="";
      
      // create key array for sorting
      keyarray = new Array();
      ind=0;
      for(var key in OAparms ) keyarray[ind++]=key;
       keyarray.sort();
       
         for(var i=0;i<keyarray.length;i++ ) {
         
            if(resultOA=="")resultOA ="OAuth ";
            else resultOA=resultOA+",";
            
             var value= OAparms[keyarray[i]];
             resultOA= resultOA+ keyarray[i]+"=\""+value+"\"";                   
          }
          console.log('OAuth header vars are: '+resultOA); 
      return resultOA;
    }


    BlueVia_percentEncode = function(instring){
         if( instring == null || instring == "" ) return "";

    var result= encodeURIComponent(instring);
    return result.replace(/\!/g, "%21")
                 .replace(/\'/g, "%27")
                 .replace(/\(/g, "%28")
                 .replace(/\)/g, "%29")
                 .replace(/\*/g, "%2A");
 }

     BlueVia_createSignature = function(key, instring){
       return   sha1.HMACSHA1(key, instring);  
     }
