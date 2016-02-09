var app = angular.module('myApp', ['ngSanitize']);

var GLOBAL = {};

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

app.controller('statusController', ['$scope', 'socket',
                                                function($scope, socket) {
    $scope.users = [];

    $scope.findUserIndex = function(gitUser) {
        for(var i=0; i<$scope.users.length; i++){
            if($scope.users[i].email==gitUser.email){
                return i;
            }
        }
        return -1;
    };

    socket.on('update_status', function (response) {
        var userIndex = $scope.findUserIndex(response.gitUser);
        if(userIndex == -1) {
            $scope.users.push({
                name : response.gitUser.name,
                email : response.gitUser.email,
                allIssues : []});
            userIndex = $scope.users.length-1;
        }
        $scope.users[userIndex].status = {
            currentBranch : response.currentBranch,
            currentIssueKey : response.issueKey,
            status : response.data
        };
    });

    socket.on('update_issue', function (response) {
        console.log(response);
        var userIndex = $scope.findUserIndex(response.gitUser);
        if(userIndex == -1) {
            $scope.users.push({
                name : response.gitUser.name,
                email : response.gitUser.email,
                allIssues : []});
            userIndex = $scope.users.length-1;
        }
        $scope.users[userIndex].issue = { active : true};
        //~
        var key = response.key;
        $scope.users[userIndex].issue.key = response.key;
        $scope.users[userIndex].issue.fields = response.fields;
        $scope.users[userIndex].issue.url = response.url;
        var fields = $scope.users[userIndex].issue.fields;
        if(fields){
            $scope.users[userIndex].issue.cachedAge = fields.cachedAge || 0;
            $scope.users[userIndex].issue.issuetype = fields.issuetype ? fields.issuetype.name || "" : "typeless";
            $scope.users[userIndex].issue.status = fields.status ? fields.status.name || "" : "without any status";
            $scope.users[userIndex].issue.assignee = fields.assignee ? fields.assignee.displayName || "" : "no one";
            $scope.users[userIndex].issue.summary = fields.summary || "";
            $scope.users[userIndex].issue.description = fields.description || "";
            $scope.users[userIndex].issue.description =  $scope.users[userIndex].issue.description.replace(/(?:\r\n|\r|\n)/g, '<br>');

            $scope.users[userIndex].issue.issueTitle = "A '"+$scope.users[userIndex].issue.issuetype+"'"
            + " issue that is '"+$scope.users[userIndex].issue.status+"'"
            + " assigned to '"+$scope.users[userIndex].issue.assignee+"'";
            //
            var comments = fields.comment.comments;
            $scope.users[userIndex].issue.comments = [];
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
                $scope.users[userIndex].issue.comments.push(com);
            }
        }
        if(key) {
            var issueIndex = -1;
            for(var i=0; i<$scope.users[userIndex].allIssues.length; i++) {
                if($scope.users[userIndex].allIssues[i].key == key){
                    issueIndex = i;
                } else{
                    $scope.users[userIndex].allIssues[i].active = false;
                }
            }
            if(issueIndex==-1){
                 $scope.users[userIndex].allIssues.push({});
                 issueIndex =  $scope.users[userIndex].allIssues.length-1;
            }
            $scope.users[userIndex].allIssues[issueIndex] = $scope.users[userIndex].issue;
        }
        //~
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



