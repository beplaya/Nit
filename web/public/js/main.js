var app = angular.module('myApp', ['ngSanitize']);

var projectKey = getParameterByName('project_key');

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


app.controller('socketController', ['$scope', '$http', 'socket', function($scope, $http, socket) {
    $scope.projectKey = projectKey;
    $scope.connected = false;
    socket.on('connected', function (data) {
        console.log('connected!!', data);
        $scope.connected = true;

        socket.emit("connection_init", {projectKey: projectKey});
    });

}]);

app.controller('statusControler', ['$scope', '$http', 'socket',
                                                function($scope, $http, socket) {
    $scope.projectKey = projectKey;
    $scope.whichData = "status";
    $scope.status = {};

    $scope.updateData = function(response) {
        var statusData = response;
        $scope.status = {raw : statusData};
        $scope.status.lines = [];
        var lines = statusData.data.split("\n");
        for(var i=0; i<lines.length; i++){
            var l = lines[i].trim();
            if(l.length>0)
                $scope.status.lines.push(lines[i]);
        }
        $scope.status.currentBranch = statusData.currentBranch;
        $scope.status.issueKey = statusData.issueKey;
    };

    $scope.isDetached = function(){
    return $scope.status.isDetached;
    };

    socket.on('update_'+$scope.whichData, function (data) {
        $scope.updateData(data);
    });
}]);


app.controller('logsControler', ['$scope', '$http', 'socket', function($scope, $http, socket) {
    $scope.projectKey = projectKey;
    $scope.whichData = "one_line_log_data";
    $scope.oneLineLogs = [];
    $scope.updateData = function(response){
        $scope.oneLineLogs = response.data.slice(0,15);
    };
    socket.on('update_'+$scope.whichData, function (data) {
        $scope.updateData(data);
    });
}]);


app.controller('issueControler', ['$scope', '$http', 'socket', function($scope, $http, socket) {
    $scope.projectKey = projectKey;
    $scope.whichData = "issue";
    $scope.updateData = function(response) {
        $scope.clear();
        $scope.ticketID = response.ticketID;
        $scope.fields = response.fields;
        $scope.url = response.url;
        var fields = $scope.fields;
        if(fields){
            $scope.cachedAge = fields.cachedAge || 0;
            $scope.issuetype = fields.issuetype ? fields.issuetype.name || "" : "typeless";
            $scope.status = fields.status ? fields.status.name || "" : "without any status";
            $scope.assignee = fields.assignee ? fields.assignee.displayName || "" : "no one";
            $scope.summary = fields.summary || "";
            $scope.description = fields.description || "";
            $scope.description =  $scope.description.replace(/(?:\r\n|\r|\n)/g, '<br>');

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
        }
    };
    $scope.clear = function(){
        $scope.ticketID = "";
        $scope.fields = {};
        $scope.url = "";
        $scope.cachedAge = 0;
        $scope.issuetype = "";
        $scope.status = "";
        $scope.assignee = "";
        $scope.summary = "";
        $scope.description = "";
        $scope.issueTitle = "...";
        $scope.comments = [];

    };
    socket.on('update_'+$scope.whichData, function (data) {
        $scope.updateData(data);
    });
}]);


