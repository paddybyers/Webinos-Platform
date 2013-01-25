var androidPayment = require('bridge').load('org.webinos.impl.PaymentImpl', this);

exports.pay = androidPayment.pay;
