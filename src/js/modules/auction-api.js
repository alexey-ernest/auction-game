(function(window, angular) {
  "use strict";

  var module = angular.module('auction-api', [
    'settings'
  ]);

  module.factory('auctionApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        
        // Adds auction to the queue
        start: function (token, item, quantity, min_bid, fn) {
          var data = {
            item: item,
            quantity: quantity,
            min_bid: min_bid
          };

          $.ajax({
            url: url + '/auction',
            type: 'POST',
            headers: {'Authorization': 'JWT ' + token},
            data: data
          }).done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Makes a bet
        bet: function (token, bid, fn) {
          var data = {
            bid: bid
          };

          $.ajax({
            url: url + '/auction/bet',
            type: 'POST',
            headers: {'Authorization': 'JWT ' + token},
            data: data
          }).done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Gets current auction
        getCurrent: function (token, fn) {
          $.ajax({
            url: url + '/auction',
            type: 'GET',
            headers: {'Authorization': 'JWT ' + token}
          }).done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Gets latest
        getLatest: function (token, fn) {
          $.ajax({
            url: url + '/auction/latest',
            type: 'GET',
            headers: {'Authorization': 'JWT ' + token}
          }).done(function(result) {
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