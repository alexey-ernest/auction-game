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
(function (angular) {
  "use strict";

  var module = angular.module('game', [
    'auction-api', 
    'access',
    'icons',
    'events'
  ]);

  module.directive('auctionGame', [
    'auctionApi', 'player', 'access', 'icons', 'events', '$mdDialog',
    function(auctionApi, player, access, icons, events, $mdDialog) {

      function loadCurrentAuction($scope) {
        if (!access.token()) return;

        $scope.loading = true;
        auctionApi.getCurrent(access.token(), function (err, data) {
          $scope.loading = false;
          if (err) return console.error(err);
          
          if (data && data.id) {
            data.icon = icons.getIcon(data.item);
            data.min_bid = data.bid ? data.bid + 1 : data.min_bid;
            $scope.canBet = $scope.player && $scope.player.id !== data.seller;
          } else {
            data = null;
          }

          $scope.auction = data;
        });
      }

      function updateAuction($scope, data) {
        if (data) {
          data.icon = icons.getIcon(data.item);
        }

        $scope.auction = data;
        $scope.canBet = $scope.player && $scope.player.id !== data.seller;
        $scope.$digest();
      }

      function loadLatestAuction($scope) {
        if (!access.token()) return;

        $scope.loading = true;

        auctionApi.getLatest(access.token(), function (err, latest) {
          $scope.loading = false;
          if (err) return console.error(err);
          
          if (latest && latest.id) {
            latest.icon = icons.getIcon(latest.item);
          } else {
            latest = null;
          }

          $scope.latest = latest;
          $scope.$digest();
        });
      }

      return {
        restrict: 'EA',
        scope: {},
        replace: true,
        templateUrl: 'game.html',
        link: function($scope) {

          $scope.player = player.get();
          $scope.$watch(function() { 
            return player.get();
          }, function(value) {
            $scope.player = value;
          });

          var $baseScope = $scope;

          loadCurrentAuction($scope);
          loadLatestAuction($scope);

          $scope.$on(events.auctionStarted, function() {
            $scope.latest = null;
            loadCurrentAuction($scope);
          });
          $scope.$on(events.auctionUpdated, function(event, data) {
            updateAuction($scope, data);
          });
          $scope.$on(events.auctionCompleted, function() {
            $scope.auction = null;
            loadLatestAuction($scope);
          });
          $scope.$on(events.noAuctions, function() {
            if ($scope.auction || $scope.latest) {
              $scope.auction = null;
              $scope.latest = null;
              $scope.$digest();
            }
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
    'icons',
    'events'
  ]);

  module.directive('auctionInventory', [
    'inventoryApi', 'auctionApi', 'player', 'access', 'icons', 'events', '$mdDialog',
    function(inventoryApi, auctionApi, player, access, icons, events, $mdDialog) {

      function applyIcons(items) {
        items.forEach(function (i) {
          i.icon = icons.getIcon(i.item);
        });
      }

      function loadInventory($scope) {
        if (!access.token()) return;

          $scope.loading = true;
          inventoryApi.get(access.token(), function (err, items) {
            $scope.loading = false;
            if (err) return console.error(err);
            
            applyIcons(items);
            $scope.inventory = items;
            $scope.$digest();
          });
      }

      return {
        restrict: 'EA',
        scope: {},
        replace: true,
        templateUrl: 'inventory.html',
        link: function($scope) {

          $scope.loading = false;
          $scope.inventory = [];
          loadInventory($scope);

          $scope.newAuction = {};
          var $baseScope = $scope;

          $scope.$on(events.auctionCompleted, function() {
            // reloading inventory
            loadInventory($scope);
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
      'player-api',
      'access',
      'player',
      'events'
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
              pageTitle: 'Log in to Crossover Auction Game'
            }
          });
        }
    ]);

    // Controllers
    module.controller('LoginCtrl', [
      '$scope', '$state', 'authApi', 'playerApi', 'access', 'player', 'events', '$mdDialog',
      function ($scope, $state, authApi, playerApi, access, player, events, $mdDialog) {

        $scope.login = {};
        $scope.loading = false;

        $scope.submit = function (params) {
          $scope.loading = true;
          authApi.login(params.name, function (err, data) {
            if (err) {
              $scope.loading = false;
              console.error(err.message);
              return $mdDialog.show($mdDialog.alert()
                .clickOutsideToClose(true)
                .title('Log in error')
                .content('Something wrong with a server.')
                .ok('Ok'));
            }

            access.token(data.token);
            player.set(null);

            // loading player data
            playerApi.get(access.token(), function (err, data) {
              $scope.loading = false;
              if (err) console.error(err.message);

              player.set(data);
              $scope.$emit(events.login, data);
              $state.go('home');
            });
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
(function (angular, io) {
  "use strict";

  var module = angular.module('socket', []);

  module.factory('socket', [function () {
    return io();
  }]);

})(window.angular, window.io);
(function (angular) {
  "use strict";

  var module = angular.module('stats', [
    'player-api', 
    'auth-api', 
    'access', 
    'player',
    'events'
  ]);
  
  module.directive('auctionStats', [
    'playerApi', 'player', '$state', 'authApi', 'access', 'events',
    function(playerApi, player, $state, authApi, access, events) {

      function loadPlayerData($scope) {
        if (!access.token()) return;

        $scope.loading = true;
        playerApi.get(access.token(), function (err, data) {
          $scope.loading = false;
          if (err && err.status === 401) {
            access.token(null);
            return $state.go('login');
          }

          if (err) return console.error(err);

          player.set(data);
          $scope.player = data;
          $scope.$digest();
        });
      }

      return {
        restrict: 'EA',
        scope: {},
        replace: true,
        templateUrl: 'stats.html',
        link: function($scope) {

          $scope.loading = false;
          $scope.player = player.get();
          
          if (!$scope.player) {
            loadPlayerData($scope);
          }

          $scope.$on(events.auctionCompleted, function() {
            // reloading player data
            loadPlayerData($scope);
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
    'game',
    'socket',
    'events',
    'access',
    'player'
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
    '$rootScope', '$state', 'socket', 'events', 'access', 'player',
    function ($rootScope, $state, socket, events, access, player) {

      // Client events
      $rootScope.$on(events.login, function (event, player) {
        socket.emit('login', player.id);
      });

      // Server events
      socket.on('logout', function () {
        $rootScope.$broadcast(events.logout);
        access.token(null);
        player.set(null);
        $state.go('login');
      });

      socket.on('auction-started', function () {
        $rootScope.$broadcast(events.auctionStarted);
      });

      socket.on('auction-updated', function (data) {
        $rootScope.$broadcast(events.auctionUpdated, data);
      });

      socket.on('auction-completed', function () {
        $rootScope.$broadcast(events.auctionCompleted);
      });

      socket.on('no-auctions', function () {
        $rootScope.$broadcast(events.noAuctions);
      });

      $rootScope.pageTitle = 'Crossover Auction Game';
      $rootScope.$on('$stateChangeSuccess', function (event, toState/*, toParams, from, fromParams*/) {
        if (angular.isDefined(toState.data) && angular.isDefined(toState.data.pageTitle)) {
          $rootScope.pageTitle = toState.data.pageTitle;
        }
      });
    }
  ]);

})((window.angular));