(function(window, angular) {
  "use strict";

  var module = angular.module('auction-api', ['settings']);

  module.factory('auctionApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        
        // Adds auction to the queue
        start: function (item, quantity, min_bid, fn) {
          var data = {
            item: item,
            quantity: quantity,
            min_bid: min_bid
          };
          $.post(url + '/auction', data)
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Makes a bet
        bet: function (bid, fn) {
          var data = {
            bid: bid
          };
          $.post(url + '/auction/bet', data)
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Gets current auction
        getCurrent: function (fn) {
          $.get(url + '/auction')
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Gets latest
        getLatest: function (fn) {
          $.get(url + '/auction/latest')
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        }
      };
    }
  ]);  
    
})(window, window.angular);