(function (window, angular) {
  "use strict";

  var module = angular.module('access', []);

  module.factory('access', [function () {
    var token;
    return {
      token: function (data) {
        if (data) {
          token = data;
        }
        return token;
      }
    };
  }]);

})(window, window.angular);
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
(function(window, angular) {
  "use strict";

  var module = angular.module('auth-api', ['settings']);

  module.factory('authApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        // Logs in by name
        login: function (name, fn) {
          var data = {
            name: name
          };

          $.ajax({
            url: url + '/login',
            type: 'POST',
            data: data
          }).done(function(result, status, jqXHR) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Logs out
        logout: function (token, fn) {
          $.ajax({
            url: url + '/logout',
            type: 'DELETE',
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
(function (angular) {
  "use strict";

  var module = angular.module('game', [
    'auction-api', 
    'access',
    'icons'
  ]);

  module.directive('auctionGame', [
    '$interval', 'auctionApi', 'player', 'access', 'icons', '$mdDialog',
    function($interval, auctionApi, player, access, icons, $mdDialog) {

      return {
        restrict: 'EA',
        scope: {},
        replace: true,
        templateUrl: 'game.html',
        link: function($scope, element) {
          $scope.loading = false;
          $scope.auction = null;
          $scope.latest = null;
          $scope.timeLeft = 0;
          $scope.canBet = false;

          $scope.player = player.get();
          $scope.$watch(function() { 
            return player.get();
          }, function(value) {
            $scope.player = value;
          });

          var $baseScope = $scope;

          // polling player data
          var timeoutId = $interval(function() {
            if (!access.token()) return;

            $scope.loading = true;
            auctionApi.getCurrent(access.token(), function (err, data) {
              $scope.loading = false;
              if (err) return console.error(err);
              
              if (!data || !data.id) {
                data = null;
                // getting latest auction
                auctionApi.getLatest(access.token(), function (err, latest) {
                  if (err) return console.error(err);
                  
                  if (latest && !latest.id) {
                    latest = null;
                  }
                  if (latest) {
                    latest.icon = icons.getIcon(latest.item);
                  }
                  $scope.latest = latest;
                });
              } else {
                var end = moment(data.end_time);
                var now = moment();
                $scope.timeLeft = end.diff(now, 's');
                $scope.canBet = $scope.player && $scope.player.id !== data.seller;

                data.icon = icons.getIcon(data.item);
                data.min_bid = data.bid ? data.bid + 1 : data.min_bid;
              }
              
              $scope.latest = null;
              $scope.auction = data;
            });
          }, 1000);

          // destructor
          $scope.$on('$destroy', function() {
            $interval.cancel(timeoutId);
          });

          // confirm auction
          function betController($scope, $mdDialog) {
            $scope.player = player.get();
            $scope.bet = $baseScope.bet;
            $scope.auction = $baseScope.auction;

            $scope.hide = function() {
              $mdDialog.hide();
            };
            $scope.cancel = function() {
              $mdDialog.cancel();
            };
            $scope.confirm = function(data) {
              $mdDialog.hide(data);
            };
          }

          $scope.doBet = function (e) {
            $scope.bet = {
              bid: $scope.auction.bid ? $scope.auction.bid + 1 : $scope.auction.min_bid
            };

            $mdDialog.show({
              controller: betController,
              templateUrl: 'bet-dialog.html',
              parent: angular.element(document.body),
              targetEvent: e,
              clickOutsideToClose: true,
              fullscreen: false
            })
            .then(function (data) {
              auctionApi.bet(access.token(), data.bid, function (err) {
                if (err) {
                  console.log(err.message);
                  return $mdDialog.show($mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Failed to place a bid')
                    .content('Try again.')
                    .ok('Ok'));
                  }

                return $mdDialog.show($mdDialog.alert()
                  .clickOutsideToClose(true)
                  .title('Bid placed')
                  .content('Your bid has been successfully placed.')
                  .ok('Ok'));
              });
            });
          };
        }
      };
    }
  ]);

})(window.angular);
(function(window, angular) {
    "use strict";

    var module = angular.module('home', [
      'ui.router',
      'access'
    ]);

    // Routes
    module.config([
      '$stateProvider', function ($stateProvider) {
        $stateProvider
          .state('home', {
            url: '/auction',
            templateUrl: 'home.html',
            controller: 'HomeCtrl',
            data: {
              pageTitle: 'Crossover Auction Game'
            }
          });
        }
    ]);

    // Controllers
    module.controller('HomeCtrl', [
      '$scope', '$state', 'access',
      function ($scope, $state, access) {
        if (!access.token()) {
          return $state.go('login');
        }
      }
    ]);
    
})(window, window.angular);
(function (window, angular) {
  "use strict";

  var module = angular.module('icons', []);

  var icons = {
    'bread': 'flaticon-bread-silhouette-side-view',
    'carrot': 'flaticon-carrot',
    'diamond': 'flaticon-jewelry-stone',
    'default': 'fa fa-star-o'
  };

  module.factory('icons', [function () {
    var token;
    return {
      getIcon: function (item) {
        return icons[item] || icons['default'];
      }
    };
  }]);

})(window, window.angular);
(function(window, angular) {
  "use strict";

  var module = angular.module('inventory-api', ['settings']);

  module.factory('inventoryApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        // Gets player inventory
        get: function (token, fn) {
          $.ajax({
            url: url + '/inventory',
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
(function (angular) {
  "use strict";

  var module = angular.module('inventory', [
    'inventory-api', 
    'auction-api', 
    'access',
    'icons'
  ]);

  module.directive('auctionInventory', [
    '$interval', 'inventoryApi', 'auctionApi', 'player', 'access', 'icons', '$mdDialog',
    function($interval, inventoryApi, auctionApi, player, access, icons, $mdDialog) {

      function applyIcons(items) {
        items.forEach(function (i) {
          i.icon = icons.getIcon(i.item);
        });
      }

      return {
        restrict: 'EA',
        scope: {},
        replace: true,
        templateUrl: 'inventory.html',
        link: function($scope, element) {
          $scope.loading = false;
          $scope.inventory = [];
          $scope.newAuction = {};

          var $baseScope = $scope;

          // polling player data
          var timeoutId = $interval(function() {
            if (!access.token()) return;

            $scope.loading = true;
            inventoryApi.get(access.token(), function (err, items) {
              $scope.loading = false;
              if (err) return console.error(err);
              
              applyIcons(items);
              $scope.inventory = items;
            });
          }, 1000);

          // destructor
          $scope.$on('$destroy', function() {
            $interval.cancel(timeoutId);
          });

          // confirm auction
          function dialogController($scope, $mdDialog) {
            $scope.auction = $baseScope.newAuction;

            $scope.hide = function() {
              $mdDialog.hide();
            };
            $scope.cancel = function() {
              $mdDialog.cancel();
            };
            $scope.confirm = function(data) {
              $mdDialog.hide(data);
            };
          }

          $scope.startAuction = function (item, e) {
            $scope.newAuction = {
              item: item,
              quantity: Math.min(5, item.quantity),
              min_bid: 50
            };

            $mdDialog.show({
              controller: dialogController,
              templateUrl: 'auction-dialog.html',
              parent: angular.element(document.body),
              targetEvent: e,
              clickOutsideToClose: true,
              fullscreen: false
            })
            .then(function (data) {
              auctionApi.start(access.token(), data.item.item, data.quantity, data.min_bid, function (err) {
                if (err) {
                  console.log(err.message);
                  return $mdDialog.show($mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Failed to start auction')
                    .content('Try again.')
                    .ok('Ok'));
                  }

                return $mdDialog.show($mdDialog.alert()
                  .clickOutsideToClose(true)
                  .title('Auction queued')
                  .content('Auction successfully added to the queue.')
                  .ok('Ok'));
              });
            });
          };
        }
      };
    }
  ]);

})(window.angular);

(function (window, angular) {
    "use strict";

    var module = angular.module('login', [
      'ui.router',
      'auth-api',
      'access',
      'player'
    ]);

    // Routes
    module.config([
      '$stateProvider', function ($stateProvider) {
        $stateProvider
          .state('login', {
            url: '/',
            templateUrl: 'login.html',
            controller: 'LoginCtrl',
            data: {
              pageTitle: 'Auction Game - Log in'
            }
          });
        }
    ]);

    // Controllers
    module.controller('LoginCtrl', [
      '$scope', '$state', 'authApi', 'access', 'player', '$mdDialog',
      function ($scope, $state, authApi, access, player, $mdDialog) {

        $scope.login = {};
        $scope.loading = false;

        $scope.submit = function (params) {
          $scope.loading = true;
          authApi.login(params.name, function (err, data) {
            $scope.loading = false;
            if (err) {
              console.error(err.message);
              return $mdDialog.show($mdDialog.alert()
                .clickOutsideToClose(true)
                .title('Log in error')
                .content('Something wrong with a server.')
                .ok('Ok'));
            }

            access.token(data.token);
            player.set(null);
            $state.go('home');
          });
        };
      }
    ]);
})(window, window.angular);
(function(window, angular) {
  "use strict";

  var module = angular.module('player-api', ['settings']);

  module.factory('playerApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        // Logs in by name
        get: function (token, fn) {
          $.ajax({
            url: url + '/player',
            type: 'GET',
            headers: {'Authorization': 'JWT ' + token}
          }).done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              err = new Error(err);
              err.status = jqXHR.status;
              fn(err);
            });
        }
      };
    }
  ]);  
    
})(window, window.angular);
(function (window, angular) {
    "use strict";

    var module = angular.module('player', []);

    module.factory('player', [function () {
      var player;
      return {
        set: function (data) {
          player = data;
        },
        get: function () {
          return player;
        }
      };
    }
  ]);

})(window, window.angular);
(function (angular) {
    "use strict";

    angular.module('settings', [])
      .constant('urls', {
        api: '/api'
      });
}) ((window.angular));
(function (angular) {
  "use strict";

  var module = angular.module('stats', [
    'player-api', 
    'auth-api', 
    'access', 
    'player'
  ]);
  
  module.directive('auctionStats', [
    '$interval', 'playerApi', 'player', '$state', 'authApi', 'access',
    function($interval, playerApi, player, $state, authApi, access) {

      return {
        restrict: 'EA',
        scope: {},
        replace: true,
        templateUrl: 'stats.html',
        link: function($scope, element) {
          $scope.player = player.get();

          // polling player data
          var timeoutId = $interval(function() {
            if (!access.token()) return;

            playerApi.get(access.token(), function (err, data) {
              if (err && err.status === 401) {
                access.token(null);
                return $state.go('login');
              }

              if (err) return console.error(err);

              player.set(data);
              $scope.player = data;
            });
          }, 1000);

          // destructor
          $scope.$on('$destroy', function() {
            $interval.cancel(timeoutId);
          });

          $scope.logout = function () {
            authApi.logout(access.token(), function (err) {
              if (err) return console.error(err);
              access.token(null);
              $state.go('login');
            });
          };
        }
      };
  }]);

})(window.angular);

(function (angular) {
  'use strict';

  var app = angular.module('auction', [
    'ui.router', // for ui routing
    'ngMaterial', // activate material design
    'home',
    'login',
    'stats',
    'inventory',
    'game'
  ]);

  // Config
  app.config([
    '$urlRouterProvider', '$locationProvider', '$stateProvider', '$mdThemingProvider',
    function ($urlRouterProvider, $locationProvider, $stateProvider, $mdThemingProvider) {
      
      // routes
      $stateProvider
        .state('auction', {
          'abstract': true,
          template: '<div ui-view></div>'
        });

      $urlRouterProvider.otherwise('/');

      // defining themes
      var lightGreenTheme = $mdThemingProvider.extendPalette('light-green', {
        'contrastLightColors': ['500']
      });
      $mdThemingProvider.definePalette('light-green-auction', lightGreenTheme);

      var deepPurpleTheme = $mdThemingProvider.extendPalette('deep-purple', {
        'contrastLightColors': ['500']
      });
      $mdThemingProvider.definePalette('deep-purple-auction', deepPurpleTheme);

      // configuring themes
      $mdThemingProvider.theme('default')
        .backgroundPalette('grey', {
          'default': '100'
        })
        .primaryPalette('deep-purple-auction', {
          'default': '500',
          'hue-1': '700',
          'hue-2': '100'
        })
        .accentPalette('light-green-auction', {
          'default': '500'
        });
    }
  ]);

  // Main application controller
  app.controller('AuctionCtrl', [
    '$rootScope',
    function ($rootScope) {

      $rootScope.pageTitle = 'Crossover Auction Game';
      $rootScope.$on('$stateChangeSuccess', function (event, toState/*, toParams, from, fromParams*/) {
        if (angular.isDefined(toState.data) && angular.isDefined(toState.data.pageTitle)) {
          $rootScope.pageTitle = toState.data.pageTitle;
        }
      });
    }
  ]);

})((window.angular));