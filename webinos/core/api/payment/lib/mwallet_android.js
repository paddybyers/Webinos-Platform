var androidPayment = require('bridge').load('org.webinos.impl.PaymentImpl', this);

var count = 0;
var baskets = {};

function newBasketId() {
  return 'basket' + count++;
}

exports.createShoppingBasket = function(successCallback, errorCallback, serviceProviderID, customerID, shopID) {
	androidPayment(function(shoppingBasket) {
	  var basketId = newBasketId();
	  baskets[basketId] = shoppingBasket;
	  successCallback([basketId]);
	}, errorCallback, serviceProviderID, customerID, shopID);
};

exports.addItem = function(basketId, successCallback, errorCallback, item) {
  var basket = baskets[basketId];
  if(!basket) {
    errorCallback( 'Internal error: no valid basketId passed ... ');
    return;
  }
  basket.addItem(successCallback, errorCallback, item);
};
