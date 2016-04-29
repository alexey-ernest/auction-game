var model = require('nodejs-model');

var Auction = model("Auction").attr('id', {
  validations: {
  }
}).attr('item', {
  validations: {
    presence: true,
  }
}).attr('quantity', {
  validations: {
    presence: true
  }
}).attr('min_bid', {
  validations: {
    presence: true
  }
});

module.exports = Auction;