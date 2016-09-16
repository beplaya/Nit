"use strict";

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

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
    $scope.curentlySelectedSprintIndex = 0;

    $scope.floor = Math.floor;
    $scope.round = Math.round;
    $scope.rgbFraction = function(fraction) {
        var r = 205-$scope.round(255*fraction);
        var g = 205-$scope.round(255*fraction);
        var b = 500-$scope.round(255*fraction);
        return "rgb("+r+","+g+","+b+")";
    };

    $scope.toCivilianHour = function(militaryHour) {
        if(militaryHour==0) {
            return "12:00AM";
        } else if(militaryHour<12) {
            return militaryHour+":00AM";
        } else {
            var h = (militaryHour-12);
            h = h==0 ? 12 : h;
            return h+":00PM";
        }
    };

    $scope.getCurrentSelectedSprint = function() {
        var css;
        if($scope.glimrData.allSprints){
            css = $scope.glimrData.allSprints[$scope.curentlySelectedSprintIndex];
        } else {
            css = $scope.glimrData.currentSprint;
        }
        if(css) {
            css.formattedStartDate = formatDate(new Date(css.startDate), true);
            css.formattedEndDate = formatDate(new Date(css.endDate), true);
        }
        return css;
    };

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
        $scope.projectKey = data.projectKey;
        console.log($scope.loggedInStatus());
    });

    socket.on('server_cache_glimr', function (response) {
        $scope.glimrData.update(response);
    });

    socket.on('current_sprint_fine_details', function (response) {
        $scope.glimrData.updateCurrentSprintFineDetails(response);
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
        glimrData.jiraIntegrated = glimrResponse.jiraIntegrated;
        glimrData.allSprints = glimrResponse.allSprints;
        glimrData.currentSprint = glimrResponse.currentSprint;
        glimrData.notifyListeners();
    };

    glimrData.updateCurrentSprintFineDetails = function(currentSprintFineDetails) {
        glimrData.currentSprintFineDetails = currentSprintFineDetails;
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