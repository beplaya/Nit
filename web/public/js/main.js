var app = angular.module('myApp', ['ngSanitize']);

var projectKey = getParameterByName('project_key');
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
    $scope.projectKey = projectKey;
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
        socket.emit("connection_init", {projectKey: projectKey});
    });

}]);

app.controller('statusControler', ['$scope', '$http', 'socket',
                                                function($scope, $http, socket) {
    $scope.projectKey = projectKey;
    $scope.whichData = "status";
    $scope.status = {};

    $scope.updateData = function(response) {
        $scope.status = {raw : response};

        $scope.status.lines = $scope.createStatusLines(response);
        $scope.status.currentBranch = response.currentBranch;
        $scope.status.issueKey = response.issueKey;
    };

    $scope.createStatusLines = function(response) {
        var lines = response.data.split("\n");
        var statusLines = [];
        for(var i=0; i<lines.length; i++){
            var l = lines[i].trim();
            if(l.length>0)
                statusLines.push(lines[i]);
        }
        return statusLines;
    };

    $scope.isDetached = function(){
        return $scope.status.isDetached;
    };

    $scope.clear = function(){
        $scope.status = {raw : {}};
        $scope.status.lines = [];
        $scope.status.currentBranch = "?";
        $scope.status.issueKey = "?";
    };

    socket.on('update_'+$scope.whichData, function (response) {
        $scope.updateData(response);
    });

    socket.on('update_pending', function (response) {
        if(!$scope.status.lines || $scope.status.lines.toString() !== $scope.createStatusLines(response).toString()){
            $scope.clear();
            $scope.status.currentBranch = response.currentBranch;
            $scope.status.issueKey = response.issueKey;
        }
    });

}]);


app.controller('logsControler', ['$scope', '$http', 'socket', function($scope, $http, socket) {
    $scope.projectKey = projectKey;
    $scope.whichData = "one_line_log_data";
    $scope.oneLineLogs = [];
    $scope.updateData = function(response){
        $scope.rawResponse = response;
        $scope.oneLineLogs = $scope.getLogLines(response);
    };
    $scope.getLogLines = function(response) {
        return response.data.slice(0, 15);
    };
    socket.on('update_'+$scope.whichData, function (response) {
        $scope.updateData(response);
    });
    $scope.clear = function(){
        $scope.oneLineLogs = [];
    };
    socket.on('update_pending', function (response) {
        if(!$scope.rawResponse || response.toString() !== $scope.rawResponse.toString()){
            $scope.clear();
        }
    });
}]);


app.controller('issueControler', ['$scope', '$http', 'socket', function($scope, $http, socket) {
    $scope.projectKey = projectKey;
    $scope.whichData = "issue";
    $scope.cachedAge = 0;
    $scope.updateSpeed = 20000;

    $scope.setInterval = setInterval(function(){
        $scope.cachedAge+=$scope.updateSpeed/1000;
        $scope.$apply();
    }, $scope.updateSpeed);

    $scope.getCachedAgeFormatted = function(){
        var leftOver = $scope.cachedAge;
        var hours = Math.floor(leftOver/60/60);
        leftOver -= (hours*60*60);
        var minutes = Math.floor(leftOver/60);
        leftOver -= (minutes*60);
        var seconds = leftOver;
        return pad(hours, 2)+":"+pad(minutes, 2)+":"+pad(seconds, 2);
    };

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
                    date : {
                        createdFormatted : formatDate(new Date(c.created)),
                        updatedFormatted : formatDate(new Date(c.updated)),
                        created : c.created,
                        updated : c.updated,
                    },
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
    socket.on('update_'+$scope.whichData, function (response) {
        $scope.updateData(response);
    });
    socket.on('update_pending', function (response) {
        if($scope.ticketID !== response.ticketID) {
            $scope.clear();
        }
    });
}]);


