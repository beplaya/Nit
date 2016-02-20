Math.standardDeviation = function(values){
  var avg = Math.average(values);

  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });

  var avgSquareDiff = Math.average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

Math.average = function(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

angular.module('nitForGitTeamApp').controller('glimrGraphController', ['$scope', 'glimrData',
                                 function($scope, glimrData) {
    $scope.glimrData = glimrData;
    $scope.seriesViewProfileIndex = 0;
    $scope.interval = setInterval(function(){
        $scope.seriesViewProfileIndex++;
        if($scope.seriesViewProfileIndex >= $scope.seriesViewProfiles.length){
            $scope.seriesViewProfileIndex = 0;
        }
        $scope.applySeriesViewProfile($scope.seriesViewProfiles[$scope.seriesViewProfileIndex]);
    }, 30000);

    $scope.max = 16;

    $scope.glimrData.addListener(function(){
        var sprintNames = [];
        var velocityArray = [];
        var numberOfCardsMergedArray = [];
        var numberOfCardsWorkedArray = [];
        var numberOfCommitsArray = [];
        var numberOfCommitsPerCardArray = [];
        var AVG_numberOfCommitsPerCardArray = [];
        var STD_ABOVE_numberOfCommitsPerCardArray = [];
        var STD_BELOW_numberOfCommitsPerCardArray = [];
        var misestimationIndexArray = [];
        var numberOfAuthorsArray = [];
        var avgCommitFreqArray = [];
        var sprints = $scope.glimrData.allSprints.reverse();
        for(var i=0; (i<sprints.length && i<$scope.max); i++) {
            sprintNames.push(sprints[i].name);
            velocityArray.push(sprints[i].sprintStoryPointVelocity);

            numberOfCardsWorkedArray.push(sprints[i].logsAnalysis.cards.length);
            numberOfCommitsArray.push(sprints[i].logsAnalysis.logObjects.length);
            var cPc = sprints[i].logsAnalysis.cards.length!=0 ? (sprints[i].logsAnalysis.logObjects.length/sprints[i].logsAnalysis.cards.length) : 0;
            numberOfCommitsPerCardArray.push(cPc);



            numberOfAuthorsArray.push(sprints[i].logsAnalysis.authors.length);
            var rollingAvg = 1*sprints[i].logsAnalysis.logObjects[0].deltas.rollingAverageMs;
            var commitFreqCPHr = rollingAvg ==0 ? 0 :1/(rollingAvg/60/60/1000);
            avgCommitFreqArray.push(commitFreqCPHr);
            var cardsWorked = sprints[i].logsAnalysis.cards;
            var numberOfCardsMerged = 0;
            for(var j=0; j<cardsWorked.length; j++) {
                var commits = cardsWorked[j].commits;
                for(var k=0; k<commits.length; k++) {
                    if(commits[k].pullRequest.isPullRequest) {
                        numberOfCardsMerged++;
                        break
                    }
                }
            }
            numberOfCardsMergedArray.push(numberOfCardsMerged);

        }

        sprintNames.reverse();
        numberOfCardsWorkedArray.reverse();
        numberOfCardsMergedArray.reverse();
        numberOfCommitsArray.reverse();
        numberOfCommitsPerCardArray.reverse();
        numberOfAuthorsArray.reverse();
        avgCommitFreqArray.reverse();

        for(var i=0; i<numberOfCommitsPerCardArray.length; i++) {
            var cPc = numberOfCommitsPerCardArray[i];
            var avg = Math.average(numberOfCommitsPerCardArray);
            AVG_numberOfCommitsPerCardArray.push(avg);
            var std = Math.standardDeviation(numberOfCommitsPerCardArray);
            STD_ABOVE_numberOfCommitsPerCardArray.push(avg+std);
            STD_BELOW_numberOfCommitsPerCardArray.push(avg-std);
            misestimationIndexArray.push(std !=0 ? ((cPc-avg) / std) : 0);
        }

        //~
        //var velocityArray = [10, 50, 39, 56, 66, 42, 33, 15, 63, 32, 40, 26, 64, 24, 42, $scope.glimrData.currentSprint.sprintStoryPointVelocity];

        var noMarker = {
            enabled : false
        };
        $scope.sprintNames = sprintNames;
        $scope.series = [
            { data: misestimationIndexArray, name:"Misestimation Index",                    type: "column", yAxis: 4, color: '#CCCCCC', marker : noMarker}
            ,{ data: numberOfCardsMergedArray, name:"Cards Merged",                         type: "spline", yAxis: 0, color: '#000000', marker : noMarker}
            ,{ data: numberOfCommitsArray, name:"Commits",                                  type: "spline", yAxis: 1, color: '#00ff00', marker : noMarker}
            ,{ data: avgCommitFreqArray, name:"Average Commit Freq.",                       type: "spline", yAxis: 2, color: '#0000ff', marker : noMarker}
            ,{ data: numberOfCommitsPerCardArray, name:"Commits Per Card",                  type: "spline", yAxis: 3, color: '#00e6e6', marker : noMarker}
            ,{ data: AVG_numberOfCommitsPerCardArray, name:"Avg. Commits Per Card",         type: "spline", yAxis: 3, color: '#008888', marker : noMarker}
            ,{ data: STD_ABOVE_numberOfCommitsPerCardArray, name:"+1std Commits Per Card",  type: "spline", yAxis: 3, color: '#AAAAAA', marker : noMarker}
            ,{ data: STD_BELOW_numberOfCommitsPerCardArray, name:"-1std Commits Per Card",  type: "spline", yAxis: 3, color: '#DDDDDD', marker : noMarker}
            ,{ data: numberOfAuthorsArray, name:"Unique Authors",                           type: "spline", yAxis: 5, color: '#ff8811', marker : noMarker}
            ,{ data: velocityArray, name:"Story Point Velocity",                            type: "spline", yAxis: 6, color: '#FF4111', marker : noMarker}
        ];
        $scope.setVisibleAllSeries(false);
        $scope.applySeriesViewProfile($scope.seriesViewProfiles[$scope.seriesViewProfileIndex]);
    }, $scope);

    $scope.seriesViewProfiles = [
        ["Cards Merged", "Story Point Velocity", "Misestimation Index"],
        ["Commits Per Card", "Story Point Velocity", "Commits"],
        ["Commits Per Card", "Avg. Commits Per Card", "+1std Commits Per Card", "-1std Commits Per Card", "Misestimation Index"]
        ["Cards Merged", "Average Commit Freq.", "Unique Authors"],
        ["Cards Merged", "Commits", "Unique Authors"],
        ];

    $scope.applySeriesViewProfile = function(profileArray) {
        $scope.setVisibleAllSeries(false);
        for(var i=0; i<profileArray.length; i++) {
            $scope.setSeriesVisibility(profileArray[i], true);
        }
        $scope.refreshChart();
    };

    $scope.setVisibleAllSeries = function(visible) {
        for(var i=0; i<$scope.series.length; i++) {
            $scope.series[i].visible = visible;
        }
    };

    $scope.setSeriesVisibility = function(seriesName, visible) {
        for(var i=0; i<$scope.series.length; i++) {
            if($scope.series[i].name == seriesName){
                $scope.series[i].visible = visible;
                break;
            }
        }
    };

    $scope.refreshChart = function(){
            var graphData = {
                title: {text:"GLIMR Sprint Report"},
                xAxis: {
                    categories: $scope.sprintNames
                },
                yAxis: [
                    {
                        gridLineWidth: 1,
                        title: {
                            text: '# of Cards'
                        },
                        opposite : false
                    }
                    ,{
                        gridLineWidth: 1,
                        title: {
                            text: '# of Commits'
                        },
                        opposite : false
                    }
                    ,{
                        gridLineWidth: 1,
                        title: {
                            text: 'Commits/Hour'
                        },
                        opposite : true
                    }
                    ,{
                        gridLineWidth: 1,
                        title: {
                            text: '# Commits Per Card'
                        },
                        opposite : true
                    }
                    ,{
                        gridLineWidth: 1,

                        title: {
                            text: 'Misestimation Index'
                        },
                        opposite : true
                    }
                    ,{
                        gridLineWidth: 1,
                        title: {
                            text: '# of Unique Authors'
                        },
                        opposite : true
                    }
                    ,{
                        gridLineWidth: 1,
                        title: {
                            text: '# of Story Points'
                        },
                        opposite : false
                    }

                ],
                series: $scope.series
            };
            Highcharts.chart('glimrGraphControllerContainer', graphData);
    };

}]);
