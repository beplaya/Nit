var app = angular.module('myApp', []);

var projectKey = getParameterByName('project_key');

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

app.controller('statusControler', ['$scope', '$http', function($scope, $http) {
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
