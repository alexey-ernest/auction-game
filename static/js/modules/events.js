(function(window, angular) {
    "use strict";

    angular.module('events', []) 
      .constant('events', {
      	'auctionStarted': 'auction-started',
      	'auctionUpdated': 'auction-updated',
      	'auctionCompleted': 'auction-completed',
      	'noAuctions': 'no-auctions',
      	'login': 'login',
      	'logout': 'logout'
      });
    
})(window, window.angular);