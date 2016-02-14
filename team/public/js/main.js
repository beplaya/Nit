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

var app = angular.module('nitForGitTeamApp', ['ngSanitize']);


app.controller('statusController', ['$scope', 'userData', 'cardData',
                            function($scope, userData, cardData) {
    $scope.userData = userData;
    $scope.cardData = cardData;
}]);

app.controller('glimrController', ['$scope', 'glimrData',
                           function($scope, glimrData) {
    $scope.glimrData = glimrData;

}]);

app.controller('socketController', ['$scope', 'socket', 'glimrData', 'userData', 'cardData',
                    function($scope, socket, glimrData, userData, cardData) {
    $scope.glimrData = glimrData;
    $scope.userData = userData;
    $scope.cardData = cardData;
    $scope.connected = false;
    $scope.isLoggedIn = false;

    $scope.loggedInStatus = function(){
        return $scope.isLoggedIn === true ? "Signed In" : "Signed Out";
    };

    socket.on('connected', function (data) {
        console.log('connected!!', data);
        $scope.connected = true;
        $scope.isLoggedIn = data.isLoggedIn;
        socket.projectKey = data.projectKey;
        console.log($scope.loggedInStatus());
    });

    socket.on('server_cache_glimr', function (response) {
        $scope.glimrData.update(response);
    });

    socket.on('server_cache_cards_and_users', function (response) {
        $scope.cardData.update(response);
        $scope.userData.update(response);
    });

}]);

app.factory('userData', function(){
    var userData = {};
    userData.update = function(response){
        userData.data = response.users;
    };
    return userData;
});

app.factory('cardData', function(){
    var cardData = {};
    cardData.update = function(response){
        cardData.data = response.cards;
    };
    return cardData;
});

app.factory('glimrData', function(){
    var glimrData = { listeners : [] };

    glimrData.notifyListeners = function(){
        for(var i=0; i<glimrData.listeners.length; i++)
            glimrData.listeners[i]();
    };

    glimrData.addListener = function(listener){
        glimrData.listeners.push(listener);
    };

    glimrData.update = function(glimrResponse){
        glimrData.allSprints = glimrResponse.allSprints;
        glimrData.logsAnalysis = glimrResponse.logsAnalysis;
        glimrData.currentSprint = glimrResponse.currentSprint;
        glimrData.currentSprint.formattedStartDate = formatDate(new Date(glimrResponse.currentSprint.startDate), true);
        glimrData.currentSprint.formattedEndDate = formatDate(new Date(glimrResponse.currentSprint.endDate), true);
        glimrData.logsAnalysis.startDate = formatDate(new Date(glimrResponse.logsAnalysis.startDate));
        glimrData.logsAnalysis.endDate = formatDate(new Date(glimrResponse.logsAnalysis.endDate));
        glimrData.notifyListeners();
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