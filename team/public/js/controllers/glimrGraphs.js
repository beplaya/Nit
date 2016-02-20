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
        var sprints = $scope.glimrData.allSprints.reverse();

        var sprintNames = [];
        var velocityArray = [];
        var avgStoryPointsPerCardArray = [];
        var overallAVG_StoryPointsPerCardArray = [];
        var overallSTD_StoryPointsPerCardArray = [];
        var overallSTD_above_StoryPointsPerCardArray = [];
        var overallSTD_below_StoryPointsPerCardArray = [];


        var numberOfCardsMergedArray = [];
        var numberOfCardsWorkedArray = [];
        var numberOfCommitsArray = [];
        var numberOfCommitsPerCardArray = [];
        var AVG_numberOfCommitsPerCardArray = [];
        var STD_ABOVE_numberOfCommitsPerCardArray = [];
        var STD_BELOW_numberOfCommitsPerCardArray = [];
        var numberOfAuthorsArray = [];
        var avgCommitFreqArray = [];

        var storyPoints_misestimation_PerCardArray = [];
        var misestimationIndexArray = [];

        var combinedMisestimationIndexArray = [];

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
        velocityArray.reverse();


        for(var i=0; i<numberOfCardsMergedArray.length; i++) {
            var asppc = numberOfCardsMergedArray[i]==0 ? 0 : velocityArray[i] / numberOfCardsMergedArray[i];
            avgStoryPointsPerCardArray.push(asppc);
        }

        var storyPointStats = {
            avg : Math.average(avgStoryPointsPerCardArray),
            std : Math.standardDeviation(avgStoryPointsPerCardArray)
        };
        for(var i=0; i<numberOfCardsMergedArray.length; i++) {
            var avg = storyPointStats.avg;
            var std = storyPointStats.std;
            var mesp = std !=0 ? ((numberOfCardsMergedArray[i]-avg) / std) : 0
            overallAVG_StoryPointsPerCardArray.push(avg);
            overallSTD_above_StoryPointsPerCardArray.push(avg+std);
            overallSTD_below_StoryPointsPerCardArray.push(avg-std);
            storyPoints_misestimation_PerCardArray.push(mesp);
        }

        var cpcStats = {
            avg : Math.average(numberOfCommitsPerCardArray),
            std : Math.standardDeviation(numberOfCommitsPerCardArray)
        };
        for(var i=0; i<numberOfCommitsPerCardArray.length; i++) {
            var cPc = numberOfCommitsPerCardArray[i];
            var avg = cpcStats.avg;
            var std = cpcStats.std;
            AVG_numberOfCommitsPerCardArray.push(avg);
            STD_ABOVE_numberOfCommitsPerCardArray.push(avg+std);
            STD_BELOW_numberOfCommitsPerCardArray.push(avg-std);
            misestimationIndexArray.push(std !=0 ? ((cPc-avg) / std) : 0);
        }

        for(var i=0; i<misestimationIndexArray.length; i++) {
            combinedMisestimationIndexArray.push(misestimationIndexArray[i]+storyPoints_misestimation_PerCardArray[i]);
        }

        var noMarker = {
            enabled : false
        };
        $scope.sprintNames = sprintNames;
        $scope.series = [
            { data: misestimationIndexArray, name:"Misestimation Index",                                  type: "column", yAxis: 4, color: '#CCCCCC', marker : noMarker}
            ,{ data: storyPoints_misestimation_PerCardArray, name:"Story Points Misestimation Index",     type: "column", yAxis: 4, color: '#FFCCEE', marker : noMarker}
            ,{ data: combinedMisestimationIndexArray, name:"Combined Misestimation Index",                type: "column", yAxis: 4, color: '#CCCCFF', marker : noMarker}
            ,{ data: numberOfCardsMergedArray, name:"Cards Merged",                                       type: "spline", yAxis: 0, color: '#000000', marker : noMarker}
            ,{ data: numberOfCommitsArray, name:"Commits",                                                type: "spline", yAxis: 1, color: '#00ff00', marker : noMarker}
            ,{ data: avgCommitFreqArray, name:"Average Commit Freq.",                       type: "spline", yAxis: 2, color: '#0000ff', marker : noMarker}
            ,{ data: numberOfCommitsPerCardArray, name:"Commits Per Card",                  type: "spline", yAxis: 3, color: '#00e6e6', marker : noMarker}
            ,{ data: AVG_numberOfCommitsPerCardArray, name:"Avg. Commits Per Card",         type: "spline", yAxis: 3, color: '#008888', marker : noMarker}
            ,{ data: STD_ABOVE_numberOfCommitsPerCardArray, name:"+1std Commits Per Card",  type: "spline", yAxis: 3, color: '#AAAAAA', marker : noMarker}
            ,{ data: STD_BELOW_numberOfCommitsPerCardArray, name:"-1std Commits Per Card",  type: "spline", yAxis: 3, color: '#DDDDDD', marker : noMarker}
            ,{ data: numberOfAuthorsArray, name:"Unique Authors",                           type: "spline", yAxis: 5, color: '#ff8811', marker : noMarker}
            ,{ data: velocityArray, name:"Story Point Velocity",                            type: "spline", yAxis: 6, color: '#FF4111', marker : noMarker}

            ,{ data: avgStoryPointsPerCardArray, name:"Avg. Story Points Per Card",                         type: "spline", yAxis: 6, color: '#FF6699', marker : noMarker}
            ,{ data: overallAVG_StoryPointsPerCardArray, name:"Overall Avg. Story Points Per Card",         type: "spline", yAxis: 6, color: '#666666', marker : noMarker}
            ,{ data: overallSTD_above_StoryPointsPerCardArray, name:"Overall +1std Story Points Per Card",  type: "spline", yAxis: 6, color: '#333333', marker : noMarker}
            ,{ data: overallSTD_below_StoryPointsPerCardArray, name:"Overall -1std Story Points Per Card",  type: "spline", yAxis: 6, color: '#999999', marker : noMarker}
        ];
        $scope.setVisibleAllSeries(false);
        $scope.applySeriesViewProfile($scope.seriesViewProfiles[$scope.seriesViewProfileIndex]);
    }, $scope);

    $scope.seriesViewProfiles = [
        ["Story Point Velocity", "Cards Merged",
            "Combined Misestimation Index", "Commits"],
        ["Story Point Velocity", "Avg. Story Points Per Card",
                "Overall Avg. Story Points Per Card", "Story Points Misestimation Index"],
        ["Story Point Velocity", "Cards Merged", "Story Points Misestimation", "Misestimation Index"],
        ["Commits Per Card", "Avg. Story Points Per Card", "Misestimation Index"],
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
