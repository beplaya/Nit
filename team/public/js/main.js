var app = angular.module('myApp', ['ngSanitize']);

var GLOBAL = {};

function formatDate(date){
    var df = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear()
       + "  "+pad(date.getHours(), 2) + ":" + pad(date.getMinutes(), 2);
    return df;
}

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

app.controller('socketController', ['$scope', '$http', 'socket', function($scope, $http, socket) {
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

app.controller('pocControler', ['$scope', 'socket',
                                                function($scope, socket) {
    $scope.data = "NOTHING";

    socket.on('update_status', function (response) {
        console.log("update_status", response);
    });

    socket.on('update_one_line_log_data', function (response) {
        console.log(response);
    });

    socket.on('update_diff', function (response) {
        console.log(response);
    });
    socket.on('update_issue', function (response) {
        console.log(response);
    });

    socket.on('update_pending', function (response) {
    });

}]);



