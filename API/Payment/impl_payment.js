
/**
 * Interface for Payment functions.
 *
 * 
 * This API provides generic shopping basket functionality to provide in-app payment.
 * 
 * It is not linked to a specific payment service provider and is designed to be 
 * sufficiently generic to be mapable to various payment services like GSMA OneAPI,
 * Andoid Payment API or PayPal.
 * 
 */

    //making namespaces
    if (typeof webinos === "undefined") { webinos = {}; }
    if (!webinos.payment) { webinos.payment = {}; }
    
    

    var WebinosPayment, Payment, ShoppingBasket, ShoppingItem, SuccessShoppingBasketCallback, PaymentSuccessCB, PaymentErrorCB, PendingOperation, PaymentError;

    var implShoppingBasket;
    var implServiceProviderID, implCustomerID, implShopID;
    
    /**
     * The WebinosPayment interface describes the part of the payment API accessible through the webinos object.
     *
     */
    WebinosPayment = function () {
        //TODO implement constructor logic if needed!

        //TODO initialize attributes

        this.payment = new Payment();
    };

    /**
     * webinos.payment object.
     *
     */
    WebinosPayment.prototype.payment = null;

    /**
     * The ShoppingBasket interface provides access to a shopping basket
     *
     * 
     * The shopping basket represents a current payment action and allows to 
     * add a number of items to the basket before proceeding to checkout.
     * 
     */
    ShoppingBasket = function () {

        // initialize attributes
        this.items =new Array(); 
        this.extras =new Array(); 
        this.totalBill = 0.0;
    };
    
    function createEmptyShoppingBasket(){ return (new ShoppingBasket())};
  
    /**
     * List of items currently in the shopping basket.
     *
     * 
     * These are the items that have been added with addItem.
     * 
     * No exceptions
     * 
     */
    ShoppingBasket.prototype.items =  null;

    /**
     * Automatically generated extra items, typically rebates, taxes and shipping costs.
     *
     * 
     * These items are automatically added to the shopping basket by update()
     * (or after the addition of an item to the basket).
     * 
     * These items can contain such 'virtual' items as payback schemes, rebates, taxes,
     * shipping costs and other items that are calculated on the basis of the regular
     * items added.
     * 
     * No exceptions
     * 
     */
    ShoppingBasket.prototype.extras = null;

    /**
     * The total amount that will be charged to the user on checkout.
     *
     * 
     * Will be updated by update(), may be updated by addItem().
     * 
     * No exceptions
     * 
     */
    ShoppingBasket.prototype.totalBill = 0.0;

    /**
     * Adds an item to a shopping basket.
     *
     */
    ShoppingBasket.prototype.addItem = function (successCallback, errorCallback, item) {

        console.log("Implementation of addItem called");
        this.items[this.items.length]=item;
        
        // the following code adds up the items and adds 19% VAT.
        // this is just an artifical assumption for testing
        // and needs to replaced by a call to the actual payment
        // service provider once we have that.
        this.totalBill = 0.0;
        for (var i=0;i<this.items.length;i++)
             this.totalBill = 
                 this.items[i].itemsPrice +
                  this.totalBill ;
                  
                  // add VAT extra
        this.extras = new Array();
        
        var VATextra= new ShoppingItem();
        VATextra.productID = "VAT";
        VATextra.description = "VAT 19%";
        if(this.items.length>0)VATextra.currency = this.items[0].currency;
        else  VATextra.currency = "EUR";
        VATextra.itemPrice = this.totalBill*0.19;
        VATextra.itemCount = 1;
        VATextra.itemsPrice =VATextra.itemPrice;
        this.extras[0]=VATextra;
        
         this.totalBill = 
                 VATextra.itemPrice+
                  this.totalBill ;
                  
        
        successCallback(this);
        return new PendingOperation();
    };

    /**
     * Updates the shopping basket
     *
     * 
     * The update function updates the values in the shopping baskets, based on 
     * the added items. Such updates may include taxes, calculating the total
     * amount, shipping costs or rebate calculations.
     * 
     * While this, preferably, is internally updated after the adding of each item,
     * such an update might require communication with the payment service provider
     * and it might be undesireable in specific implementations to perform such
     * a query after each individual item, so a specifc update function is provided
     * to force such an update.
     * 
     * The checkout function will always perform an update internally before
     * payment.
     * 
     */
    ShoppingBasket.prototype.update = function (successCallback, errorCallback) {
        console.log("Implementation of update called");
        // as an example, this function consolidates the list by
        // adding multiple identical entries to one item with a
        // higher item count (and then follows it up with the same
        // stuff that addItem does - add 19% VAT.
        // This needs to be replaced by a call to the payment 
        // provider, once we got that, but at the moment it shows
        // that update might do processing that a simple additem
        // does not...
        
        // looking for identical product codes in the list
        lookAgain=1;
        while (lookAgain==1){
        	lookAgain=0;
        	for (i=1;i<this.items.length;i++)
        	  for(j=0;j<i;j++){
        	  if(this.items[i].productID==this.items[j].productID){
        	  	this.items[j].itemCount=this.items[i].itemCount+this.items[j].itemCount;
        	  	this.items[j].itemsPrice=this.items[j].itemPrice*this.items[j].itemCount;
        	  	lookAgain=1;
        	  	this.items.splice(i,1);
        	  	// poor man's break statement...
        	  	i=this.items.length+1;
        	  	j=this.items.length+1;
        	  }
        	  }
        }
        
        
        // rest copied from addItem
       this.totalBill = 0.0;
        for (var i=0;i<this.items.length;i++)
             this.totalBill = 
                 this.items[i].itemsPrice +
                  this.totalBill ;
                  
                  // add VAT extra
        this.extras = new Array();
        
        var VATextra= new ShoppingItem();
        VATextra.productID = "VAT";
        VATextra.description = "VAT 19%";
        if(this.items.length>0)VATextra.currency = this.items[0].currency;
        else  VATextra.currency = "EUR";
        VATextra.itemPrice = this.totalBill*0.19;
        VATextra.itemCount = 1;
        VATextra.itemsPrice =VATextra.itemPrice;
        this.extras[0]=VATextra;
        
         this.totalBill = 
                 VATextra.itemPrice+
                  this.totalBill ;
        successCallback(this);
        return new PendingOperation();
    };

    /**
     * Performs the checkout of the shopping basket.
     *
     * 
     * The items in the shopping basket will be charged to the shopper.
     * 
     * Depending on the implementation of the actual payment service, this function
     * might cause the checkout screen of the payment service provider to be displayed.
     * 
     */
    ShoppingBasket.prototype.checkout = function (successCallback, errorCallback) {
        // we don't have any real checkout function yet - this
        // requires a service provider - so we just release the shopping basket
         console.log("Implementation of checkout called");
        self=null;
        successCallback(this);
        return new PendingOperation();
    };

    /**
     * Releases a shopping basket.
     *
     * 
     * The current shopping basket will be released.
     * 
     * If no checkout has been performed, the initiated shopping transaction will be cancelled.
     * 
     */
    ShoppingBasket.prototype.release = function () {
    	 console.log("Implementation of release called");
        self=null;
        return;
    };

    /**
     * The ShoppingItem captures the attributes of a single shopping product
     *
     * 
     * The shopping basket represents a current payment action and allows to 
     * add a number of items to the basket before proceeding to checkout.
     * 
     */
    ShoppingItem = function () {

        // initialize attributes

        this.productID = "";
        this.description = "";
        this.currency = "EUR";
        this.itemPrice = 0.0;
        this.itemCount = 0;
        this.itemsPrice = 0.0;
    };

    /**
     * An id that allows the shop to identify the purchased item
     *
     * 
     * No exceptions
     * 
     */
    ShoppingItem.prototype.productID = ""

    /**
     * A human-readable text to appear on the bill, so the user can easily see what they bought.
     *
     * 
     * No exceptions
     * 
     */
    ShoppingItem.prototype.description = "";

    /**
     * The 3-figure code as per ISO 4217.
     *
     * 
     * No exceptions
     * 
     */
    ShoppingItem.prototype.currency = "EUR";

    /**
     * The price per individual item in the currency given above, a negative number represents a refund.
     *
     * 
     * No exceptions
     * 
     */
    ShoppingItem.prototype.itemPrice = 0.0;

    /**
     * The number of identical items purchased
     *
     * 
     * No exceptions
     * 
     */
    ShoppingItem.prototype.itemCount = 0;

    /**
     * Price for all products in this shopping item.
     *
     * 
     * Typically this is itemPrice*itemCount, but special '3 for 2' rebates might apply.
     * 
     * Updated by the shopping basket update function.
     * 
     * No exceptions
     * 
     */
    ShoppingItem.prototype.itemsPrice = 0.0;

    /**
     * Callback for successful creation of a shopping basket
     *
     */
    SuccessShoppingBasketCallback = function () {
        //TODO implement constructor logic if needed!

    };

    /**
     * Callback for successful creation of a shopping basket
     *
     */
    SuccessShoppingBasketCallback.prototype.onSuccess = function (basket) {
        //TODO: Add your application logic here!

        return;
    };

    /**
     * Callback for successful payment related functions
     *
     */
    PaymentSuccessCB = function () {
        //TODO implement constructor logic if needed!

    };

    /**
     * Callback for successful of payment related functions
     *
     */
    PaymentSuccessCB.prototype.onSuccess = function () {
        //TODO: Add your application logic here!

        return;
    };

    /**
     * Callback for errors during payment related functions
     *
     */
    PaymentErrorCB = function () {
        //TODO implement constructor logic if needed!

    };

    /**
     * Callback for errors during payment related functions
     *
     */
    PaymentErrorCB.prototype.onError = function (error) {
        //TODO: Add your application logic here!

        return;
    };

    /**
     * The PendingOperation interface
     *
     * 
     * The PendingOperation interface describes objects that are returned by asynchronous methods that are cancellable. It makes it possible to bring 
     * these operations to a stop if they haven't produced a result within a desired time or before a given event, thereby possibly reclaiming resources.
     * 
     */
    PendingOperation = function () {
        //TODO implement constructor logic if needed!

    };

    /**
     * Method Cancel
     *
     * 
     * Cancel the pending asynchronous operation. When this method is called, the user agent must immediately bring the operation to a stop and return. No success or error callback for the pending operation will be invoked.
     * 
     */
    PendingOperation.prototype.cancel = function () {
        //TODO: Add your application logic here!

        return;
    };

    /**
     * Payment specific errors.
     *
     * 
     * The PaymentError interface encapsulates all errors in the manipulation of payments objects in the Payment API.
     * 
     */
    PaymentError = function () {
        //TODO implement constructor logic if needed!

        //TODO initialize attributes

        this.code = Number;
        this.message = String;
    };

    /**
     * Bill is already open
     *
     */
    PaymentError.prototype.PAYMENT_SHOPPING_BASKET_OPEN_ERROR = 1;

    /**
     * Bill is not open
     *
     */
    PaymentError.prototype.PAYMENT_SHOPPING_BASKET_NOT_OPEN_ERROR = 2;

    /**
     * Charging operation failed, the charge was not applied
     *
     */
    PaymentError.prototype.PAYMENT_CHARGE_FAILED = 3;

    /**
     * Refunds not supported
     *
     */
    PaymentError.prototype.PAYMENT_REFUND_NOT_SUPPORTED = 4;

    /**
     * Refund failed
     *
     */
    PaymentError.prototype.PAYMENT_REFUND_FAILED = 5;

    /**
     * Chargeable amount exceeded
     *
     */
    PaymentError.prototype.PAYMENT_CHARGEABLE_EXCEEDED = 6;

    /**
     * Chargeable Authentication failed. Payment credentials are incorrect.
     *
     */
    PaymentError.prototype.PAYMENT_AUTHENTICATION_FAILED = 7;

    /**
     * An error code assigned by an implementation when an error has occurred in Payment processing.
     *
     * 
     * No exceptions.
     * 
     */
    PaymentError.prototype.code = Number;

    /**
     * A text describing an error occuring in the Payment in human readable form.
     *
     * 
     * No exceptions.
     * 
     */
    PaymentError.prototype.message = String;

    /**
     * The Payment interface
     *
     * 
     * The Payment interface provides access to payment functionality.
     * 
     * The API supports creation of a shopping basket, adding items to the shopping
     * basket, proceeding to checkout and releasing the shopping basket.
     * 
     * This essentially echoes the usual 'shopping basket' system used on many web sites.
     * 
     * The code example below refunds the user for a returned CD and charges for
     * the deluxe edition of that CD, demonstarting charging and refunding payments.
     * 
     */
    Payment = function () {
        //TODO implement constructor logic if needed!

    };
    webinos.payment = new Payment();

    /**
     * Creates a shopping basket
     *
     */
    webinos.payment.createShoppingBasket = function (successCallback, errorCallback, serviceProviderID, customerID, shopID) {
		console.log("Implementation of createshoppingbasket called");

      implServiceProviderID = serviceProviderID;
      implCustomerID = customerID;
      implShopID = shopID; 
    
        basket = new ShoppingBasket();
        successCallback(basket);
        return new PendingOperation();
    };
    
exports.createShoppingBasket = webinos.payment.createShoppingBasket;
exports.ShoppingBasket = ShoppingBasket;

    