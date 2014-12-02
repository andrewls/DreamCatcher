'use strict';

angular.module('dreamCatcherApp')
  .factory('goalFactory', ['$http', 'serverUrl', '$q', function ($http, serverUrl, $q) {

  	//factories are typically used for data processing. In this case, we just define a json object and return it,
  	//and any controller (or even other factory) that injects 'goalFactory' will be able to use all of the functions
  	//and variables that we define here.

    var factory = {};

    //any other controller/factory can now access goalFactory.meaningOfLife and it will be this value.
    factory.acceptedGoalFields = [
      'name',
      'type',
      'description',
      'deadline',
      'startDate',
      'endDate',
      'habit',
      'frequency',
      'quantitative',
      'amount',
      'progress',
      'reminders',
      'parentId',
      'parentType'
    ]

    factory.httpStripGoal = function(goal) {
      for (var key in goal) {
        if (!factory.acceptedGoalFields.indexOf(key) == -1) {
          delete goal[key];
        }
      }
    }

    factory.setParentIdsOnSubgoals = function(parent) {
      if (parent.subgoals) {
        for (var i = 0; i < parent.subgoals.length; i++) {
          parent.subgoals[i].parentId = parent.id;
          parent.subgoals[i].parentType = 'goal';
        }
      }
    }

    factory.getGoals = function(parentId, parentType) {

      //set up the query params
      var options = {params: {}};
      if (parentId)
        options.params.parentId = parentId;
      if (parentType)
        options.params.parentType = parentType;

      //send the actual request
      var defer = $q.defer();
      $http.get(serverUrl + 'api/goals', null, options).success(function(goals) {
        defer.resolve(goals);
      }).error(function() {
        defer.reject('Could not get goals');
      });
      return defer.promise;
    }

    factory.getGoal = function(id) {
      var defer = $q.defer();
      $http.get(serverUrl + 'api/goals/' + id).success(function(goal) {
        defer.resolve(goal);
      }).error(function() {
        defer.reject('Could not get goal');
      });
      return defer.promise;
    }

    factory.postGoal = function(goal) {

      console.log('About to post goal ', goal);

      var copy = angular.copy(goal);
      var promises = [];

      if (copy.subgoals && copy.suboals.length) {
        factory.setParentIdsOnSubgoals(copy);
        promises[1] = factory.postGoals(copy.subgoals);
      }

      factory.httpStripGoal(copy);

      var postPromise = $q.defer();
      $http.post(serverUrl + 'api/goals', copy).success(function(postedGoal) {
        postPromise.resolve(postedGoal);
      }).error(function() {
        postPromise.reject('Could not post goal');
      });
      promises[0] = postPromise.promise;

      var defer = $q.defer();
      $q.all(promises, function(data) {
        var posted = data[0];
        if (data.length > 1) {
          posted.subgoals = data[1];
        }
        defer.resolve(posted);
      }, function() {
        defer.reject('Either the goal or one of its children failed to post');
      })
      return defer.promise;
    }

    //this is just for posting more than one goal at once, for speed purposes
    factory.postGoals = function(goalData) {

      console.log('About to post goals ', goalData);

      var goals = angular.copy(goalData);
      var subgoals = [];
      var promises = [];

      for (var i = 0; i < goals.length; i++) {
        if (goals[i].subgoals && goals[i].subgoals.length) {
          factory.setParentIdsOnSubgoals(goals[i]);
          subgoals.push.apply(subgoals, goals[i].subgoals);
        }
      }

      if (subgoals.length) {
        promises[1] = factory.postGoals(subgoals);
      } 

      for (var i = 0; i < goals.length; i++) {
        factory.httpStripGoal(goals[i]);
      }

      var postPromise = $q.defer();
      $http.post(serverUrl + 'api/goals', goals).success(function(goal) {
        postPromise.resolve(goal);
      }).error(function() {
        postPromise.reject('Error when posting goal');
      });
      promises[0] = postPromise.promise;

      var defer = $q.defer();
      $q.all(promises, function(data) {
        var goals = data[0];
        if (data.length > 1) {
          //so now we need to loop through each of the goals
          //and map it to its children
          var parentToChildMap = {};
          var subgoals = data[1];
          for (var i = 0; i < subgoals.length; i++) {
            if (!parentToChildMap[subgoals[i].parentId])
              parentToChildMap[subgoals[i].parentId] = [];
            parentToChildMap[subgoals[i].parentId].push(subgoals[i]);
          }
          //and now each parent needs to get its children
          for (var i = 0; i < goals.length; i++) {
            goals[i].subgoals = parentToChildMap[goals[i].id];
          }
        }
        //and now we can finally return the array
        defer.resolve(goals);
      }, function() {
        defer.reject('One or more of the goals or its subgoals failed to update');
      });
      return defer.promise;
    }

    factory.putGoal = function(goal) {
      var copy = angular.copy(goal);
      var promises = [];

      if (copy.subgoals && copy.subgoals.length) {
        factory.setParentIdsOnSubgoals(copy);
        promises[1] = factory.putGoals(copy.subgoals);
      }

      var putPromise = $q.defer();
      $http.put(serverUrl + 'api/goals', copy.id, copy).success(function(putGoal) {
        putPromise.resolve(putGoal);
      }).error(function() {
        putPromise.reject('Error when putting goal');
      });
      promises[0] = putPromise.promise;


      var defer = $q.defer();
      $q.all(promises, function(data) {
        var putGoal = data[0];
        if (data.length > 1) {
          putGoal.subgoals = data[1];
        }
        defer.resolve(putGoal);
      }, function() {
        defer.reject('Either the goal or one of its children failed to update');
      });
      return defer.promise;
    }

    factory.putGoals = function(goalData) {
      var goals = angular.copy(goalData);

      //so this sucks a little more than dreams, because we 
      //also need to support recursively updating the sub goals
      //on each individual goal we're updating here
      var subgoals = [];

      //doing an additional put for each level also necessitates
      //using an array to store the promises
      var promises = [];


      for (var i = 0; i < goals.length; i++) {
        if (goals[i].subgoals && goals[i].subgoals.length) {
          factory.setParentIdsOnSubgoals(goals[i]);
          //push all of the subgoals into one giant array
          subgoals.push.apply(subgoals, goals[i].subgoals);
        }
      }

      //now update the subgoals
      if (subgoals.length) {
        promises[1] = factory.putGoals(subgoals);
      }

      //now strip all of the extra fields off of the goals fields
      //to be able to update them correctly
      for (var i = 0; i < goals.length; i++) {
        factory.httpStripGoal(goals[i]);
      }

      //add the initial promise for this array
      var putPromise = $q.defer();
      $http.put(serverUrl + 'api/goals', copy.id, copy).success(function(putGoal) {
        putPromise.resolve(putGoal);
      }).error(function() {
        putPromise.reject('Error when putting goal');
      });
      promises[0] = putPromise.promise;

      var defer = $q.defer();
      $q.all(promises, function(data) {
        var goals = data[0];
        if (data.length > 1) {
          //so now we need to loop through each of the goals
          //and map it to its children
          var parentToChildMap = {};
          var subgoals = data[1];
          for (var i = 0; i < subgoals.length; i++) {
            if (!parentToChildMap[subgoals[i].parentId])
              parentToChildMap[subgoals[i].parentId] = [];
            parentToChildMap[subgoals[i].parentId].push(subgoals[i]);
          }
          //and now each parent needs to get its children
          for (var i = 0; i < goals.length; i++) {
            goals[i].subgoals = parentToChildMap[goals[i].id];
          }
        }
        //and now we can finally return the array
        defer.resolve(goals);
      }, function() {
        defer.reject('One or more of the goals or its subgoals failed to update');
      });
      return defer.promise; 
    }

    factory.deleteGoal = function(goal) {
      var defer = $q.defer();
      $http.delete(serverUrl + 'api/goals/' + goal.id).success(function() {
        defer.resolve();
      }).error(function() {
        defer.reject('Could not delete the given goal');
      });
      return defer.promise;
    }

    return factory;
  }]);
