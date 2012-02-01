(function() {

var wPayment = require('./impl_payment.js');
        
var basket = null;

/**
 * Webinos Service constructor.
 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
 */
var PaymentModule = function(rpcHandler) {
        // inherit from RPCWebinosService
        this.base = RPCWebinosService;
        this.base({
                api:'http://webinos.org/api/payment',
                displayName:'payment',
                description:'A Webinos Payment API.'
        });
}



PaymentModule.prototype = new RPCWebinosService;

PaymentModule.prototype.createShoppingBasket = function ( params, successCallback,  errorCallback){

  console.log("createShoppingBasket called on rpc receiver");

  wPayment.createShoppingBasket( 
    function (result){
          basket = result;
          successCallback(result);
       },
       function (error){
            errorCallback(error);
       },
       params[0], params[1], params[2]
  );

}

PaymentModule.prototype.addItem = function ( params, successCallback,  errorCallback){

          console.log("addItem called on rpc receiver");
          basket = new wPayment.ShoppingBasket();
          // fill basket with items so far      
          basket.items=params[3].items;
          basket.extras=params[3].extras;
          basket.totalBill=params[3].totalBill;
          // add the new item   
          basket.addItem( 
          function (){
             successCallback(basket);
          },
          function (error){
            errorCallback(error);
         },
         params[4]
       );
}

PaymentModule.prototype.update = function ( params, successCallback,  errorCallback){

          console.log("update (ShoppingBasket) called on rpc receiver");
          basket = new wPayment.ShoppingBasket();
          // fill basket with items so far      
          basket.items=params[3].items;
          basket.extras=params[3].extras;
          basket.totalBill=params[3].totalBill;
          // update the basket
          basket.update( 
          function (){
             successCallback(basket);
          },
          function (error){
            errorCallback(error);
         }
       );
}    

PaymentModule.prototype.checkout = function ( params, successCallback,  errorCallback){

          console.log("checkout (ShoppingBasket) called on rpc receiver");
          basket = new wPayment.ShoppingBasket();
          // fill basket with items so far      
          basket.items=params[3].items;
          basket.extras=params[3].extras;
          basket.totalBill=params[3].totalBill;
          // checkout the basket
          basket.checkout( 
          function (){
             successCallback(basket);
          },
          function (error){
            errorCallback(error);
         }
       );
}    

PaymentModule.prototype.release = function ( params, successCallback,  errorCallback){

          console.log("release (ShoppingBasket) called on rpc receiver");
          // this one could just do nothing and ignore
          // the basket, but we want to keep this properly similar
          // with addItem, update and checkout, so we create
          // a proper basket, just to kill it again...
          basket = new wPayment.ShoppingBasket();
          // fill basket with items so far      
          basket.items=params[3].items;
          basket.extras=params[3].extras;
          basket.totalBill=params[3].totalBill;
          // release the basket
          basket.release();
          successCallback(basket);
}    


//export our object
exports.Service = PaymentModule;

})();
