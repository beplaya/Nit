"use strict";

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function formatDate(date, noMinutes){
    var df = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();

    if(!noMinutes)
        df += "  "+pad(date.getHours(), 2) + ":" + pad(date.getMinutes(), 2);
    return df;
}

//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

var app = angular.module('myApp', ['ngSanitize']);


app.controller('statusController', ['$scope', 'socket', 'users', 'cards',
                            function($scope, socket, users, cards) {
    $scope.users = users;
    $scope.cards = cards;

}]);

app.controller('glimrController', ['$scope', 'socket', 'glimrData',
                                                function($scope, socket, glimrData) {
    $scope.glimrData = glimrData;

}]);

app.controller('glimrGraphsController', ['$scope', 'socket', 'glimrData',
                                                function($scope, socket, glimrData) {
    $scope.glimrData = glimrData;

}]);
app.controller('socketController', ['$scope', '$http', 'socket', 'glimrData',
                    'users', 'cards', function($scope, $http, socket, glimrData, users, cards) {
    $scope.glimrData = glimrData;
    $scope.users = users;
    $scope.cards = cards;
    $scope.connected = false;
    $scope.isLoggedIn = false;

    $scope.loggedInStatus = function(){
        return $scope.isLoggedIn === true ? "Signed In" : "Signed Out";
    };

    socket.on('connected', function (data) {
        console.log('connected!!', data);
        $scope.connected = true;
        $scope.isLoggedIn = data.isLoggedIn;
        console.log($scope.loggedInStatus());
        socket.projectKey = data.projectKey;
    });

    socket.on('server_cache_glimr', function (response) {
        $scope.glimrData.update(response);
    });

    socket.on('server_cache_cards_and_users', function (response) {
        $scope.cards = response.cards;
        $scope.users = response.users;
    });

}]);

app.factory('users', function(){
    var users = [];
    return users;
});
app.factory('cards', function(){
    var cards = [];
    return cards;
});
app.factory('glimrData', function(){
    var glimrData = {};

    glimrData.update = function(glimrResponse){
        glimrData.allSprints = glimrResponse.allSprints;
        glimrData.logsAnalysis = glimrResponse.logsAnalysis;
        glimrData.currentSprint = glimrResponse.currentSprint;
        glimrData.currentSprint.formattedStartDate = formatDate(new Date(glimrResponse.currentSprint.startDate), true);
        glimrData.currentSprint.formattedEndDate = formatDate(new Date(glimrResponse.currentSprint.endDate), true);
        glimrData.logsAnalysis.startDate = formatDate(new Date(glimrResponse.logsAnalysis.startDate));
        glimrData.logsAnalysis.endDate = formatDate(new Date(glimrResponse.logsAnalysis.endDate));
    };

    return glimrData;
});

app.factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});

app.filter('reverse', function() {
  return function(items) {
    items = items || [];
    return items.slice().reverse();
  };
});