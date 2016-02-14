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

app.controller('socketController', ['$scope', '$http', 'socket',
                function($scope, $http, socket) {
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

}]);

app.controller('statusController', ['$scope', 'socket', 'glimrData',
                                                function($scope, socket, glimrData) {
    $scope.users = [];
    $scope.cards = [];
    $scope.glimrData = glimrData;
    $scope.formatDate = formatDate;

    $scope.findUserIndex = function(gitUser) {
        for(var i=0; i<$scope.users.length; i++){
            if($scope.users[i].email==gitUser.email){
                return i;
            }
        }
        return -1;
    };

    $scope.findCardIndex = function(issueKey) {
        for(var i=0; i<$scope.cards.length; i++){
            if($scope.cards[i].key==issueKey){
                return i;
            }
        }
        return -1;
    };

    socket.on('server_cache_cards_and_users', function (response) {
        $scope.cards = response.cards;
        $scope.users = response.users;
    });

    socket.on('server_cache_glimr', function (response) {
        $scope.glimrData.update(response);
    });

}]);

app.controller('pocController', ['$scope', 'socket',
                                                function($scope, socket) {
    socket.on('update_one_line_log_data', function (response) {
        //console.log(response);
    });

    socket.on('update_diff', function (response) {
        //console.log(response);
    });

    socket.on('update_pending', function (response) {
        //console.log(response);
    });

}]);



app.filter('reverse', function() {
  return function(items) {
    items = items || [];
    return items.slice().reverse();
  };
});