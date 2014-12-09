'use strict';

angular.module('dreamCatcherApp')
  .controller('LoginCtrl', function ($scope, Auth, $location, $window, navchain) {
    $scope.user = {};
    $scope.errors = {};

    $scope.login = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.login({
          email: $scope.user.email,
          password: $scope.user.password
        })
        .then( function() {
          // Logged in, redirect to home
          navchain.init();
          $location.path('/');
        })
        .catch( function(err) {
		  console.log(err);
          $scope.errors.other = err.message;
        });
      }
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };
  });
