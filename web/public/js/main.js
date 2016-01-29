var app = angular.module('myApp', []);

var projectKey = getParameterByName('project_key');

//
//var socket = io.connect('http://localhost:9000');
//
//// listening for the connected event from the server
//socket.on('connected', function(data) {
//    console.log('The server said: ' + data.message);
//});
//
//// sending a message event to the server
//socket.emit('message', { message: 'Hi!' });

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

app.factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                console.log("ON~!!");
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                console.log("emit~!!");
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});


app.controller('socketController', ['$scope', 'socket', function($scope, socket) {
    $scope.connected = false;
    socket.on('connected', function (data) {
        console.log('connected!!');
        $scope.connected = true;
    });
    socket.on('update', function (data) {
        console.log('update now!!');
    });
}]);

app.controller('statusControler', ['$scope', '$http',
                                                function($scope, $http) {
  $scope.projectKey = projectKey;
  $scope.status = {};

  $scope.update = function(){
    $http.get("projects/"+$scope.projectKey+"/status")
        .then(function(response) {
            $scope.status = response.data;
    }, function(){
        console.log("Error!");
    });
  };

  $scope.isDetached = function(){
    return $scope.status.isDetached;
  };

  $scope.update();
}]);


app.controller('logsControler', ['$scope', '$http', function($scope, $http) {
  $scope.projectKey = projectKey;
  $scope.oneLineLogs = [];
  $scope.update = function(){
    $http.get("projects/"+$scope.projectKey+"/one_line_log_data")
        .then(function(response) {
            $scope.oneLineLogs = response.data.slice(0,15);
    }, function(){
        console.log("Error!");
    });
  };
  $scope.update();
}]);


app.controller('issueControler', ['$scope', '$http', function($scope, $http) {
  $scope.projectKey = projectKey;
  $scope.update = function(){
    $http.get("projects/"+$scope.projectKey+"/issue")
        .then(function(response) {
            $scope.ticketID = response.data.ticketID;
            $scope.fields = response.data.fields;
            $scope.url = response.data.url;
            var fields = $scope.fields;
            $scope.cachedAge = fields.cachedAge || 0;
            $scope.issuetype = fields.issuetype ? fields.issuetype.name || "" : "typeless";
            $scope.status = fields.status ? fields.status.name || "" : "without any status";
            $scope.assignee = fields.assignee ? fields.assignee.displayName || "" : "no one";
            $scope.summary = fields.summary || "";

            $scope.issueTitle = "A '"+$scope.issuetype+"'"
            + " issue that is '"+$scope.status+"'"
            + " assigned to '"+$scope.assignee+"'";
            //
            var comments = fields.comment.comments;
            $scope.comments = [];
            for(var i=0; i<comments.length; i++) {
                var c = comments[i];
                var com = {
                    author : c.author.displayName,
                    concise : "    # author: "
                        + c.author.name  + " created: "
                        + c.created  + " updated: "+c.updated,
                    body : c.body
                };
                $scope.comments.push(com);
            }
    }, function(){
        console.log("Error!");
    });
  };
  $scope.update();
}]);


