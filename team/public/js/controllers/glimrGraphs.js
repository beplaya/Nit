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
Math.averageByWeight = function(weightedData){
    var data = [];
    for(var i=0; i<weightedData.length; i++) {
        for(var j=0; j<weightedData[i].multiplier; j++) {
            data.push(weightedData[i].value);
        }
    }
    return Math.average(data);
}

angular.module('nitForGitTeamApp').controller('glimrGraphController', ['$scope', 'glimrData',
                                    'slideShow',
                                 function($scope, glimrData, slideShow) {

    $scope.slideShow = slideShow;
    $scope.display = true;
    $scope.slideShow.addSlide(function(display){
        $scope.display = display;
        setTimeout(function(){
            if($scope.display) {
                $scope.glimrData.notifyListeners();
            }
        }, 500);
    });
    $scope.max = 20;

    $scope.glimrData = glimrData;
    $scope.seriesViewProfileIndex = 0;
    $scope.shouldSeriesRotate = false;
    $scope.interval = setInterval(function(){
        if($scope.shouldSeriesRotate) {
            $scope.advanceSeriesForward();
        }
    }, 30000);

    $scope.advanceSeriesForward = function(){
        $scope.seriesViewProfileIndex++;
        if($scope.seriesViewProfileIndex >= $scope.seriesViewProfiles.length){
            $scope.seriesViewProfileIndex = 0;
        }
        $scope.applySeriesViewProfile($scope.seriesViewProfiles[$scope.seriesViewProfileIndex]);
    };

    $scope.advanceSeriesBackward = function(){
        $scope.seriesViewProfileIndex--;
        if($scope.seriesViewProfileIndex < 0){
            $scope.seriesViewProfileIndex =  $scope.seriesViewProfiles.length - 1;
        }
        $scope.applySeriesViewProfile($scope.seriesViewProfiles[$scope.seriesViewProfileIndex]);
    };

    $scope.toggleRotateSeries = function(){
        $scope.shouldSeriesRotate = !$scope.shouldSeriesRotate;
    };

    $scope.onNextSeries = function(){
        $scope.shouldSeriesRotate = false;
        $scope.advanceSeriesForward();
    };

    $scope.onPreviousSeries = function(){
        $scope.shouldSeriesRotate = false;
        $scope.advanceSeriesBackward();
    };

    $scope.glimrData.addListener(function(){
        //Current sprint
        var sprintDetails = $scope.glimrData.currentSprintFineDetails;
        if(sprintDetails){
            var statusObjects = sprintDetails.statusObjects;

            var chartOptions = {
                chart : {type : 'column'},
                title : {text:sprintDetails.sprintName},
                subtitle : {text:sprintDetails.projectKey},
                yAxis : {min: 0},
                plotOptions: {
                            column: {
                                pointPadding: 0.2,
                                borderWidth: 0
                            }
                        }
            };
            chartOptions.xAxis = { categories :[], crosshair:true};
            chartOptions.series = [{name: "Story Points", data:[]},
                                    {name: "# Issues", data:[]}];
            for(var i=0;  i<statusObjects.length; i++) {
                chartOptions.xAxis.categories.push(statusObjects[i].status);
                chartOptions.series[0].data.push(statusObjects[i].storyPoints);
                chartOptions.series[1].data.push(statusObjects[i].numberOfIssues);
            }
            $('#glimrGraphControllerContainerSprintDetails').highcharts(chartOptions);
        }
    });

    $scope.glimrData.addListener(function(){
        //All sprints
        var sprints = $scope.glimrData.allSprints;

        var sprintNames = [];
        var velocityArray = [];
        var AVG_velocityArray = [];
        var STD_velocityArray = [];
        var PREDICTED_velocityArray = [];
        var PREDICTED_velocityArray_top = [];
        var PREDICTED_velocityArray_bottom = [];
        var avgStoryPointsPerCardArray = [];
        var overallAVG_StoryPointsPerCardArray = [];
        var overallSTD_StoryPointsPerCardArray = [];
        var overallSTD_above_StoryPointsPerCardArray = [];
        var overallSTD_below_StoryPointsPerCardArray = [];


        var numberOfCardsMergedArray = [];

        var numberOfCardsWorkedArray = [];

        var numberOfCommitsArray = [];
        var AVG_numberOfCommitsArray = [];
        var STD_numberOfCommitsArray = [];

        var numberOfCommitsPerCardArray = [];
        var AVG_numberOfCommitsPerCardArray = [];
        var STD_ABOVE_numberOfCommitsPerCardArray = [];
        var STD_BELOW_numberOfCommitsPerCardArray = [];
        var numberOfAuthorsArray = [];
        var avgCommitFreqArray = [];

        var storyPoints_misestimation_PerCardArray = [];
        var misestimationIndexArray = [];

        var combinedMisestimationIndexArray = [];

        var minI = (sprints.length-1)-$scope.max;
        minI = minI<0 ? 0 : minI;

        for(var i=sprints.length-1; i>=minI; i--) {
            sprintNames.push(sprints[i].name);
            velocityArray.push(sprints[i].sprintStoryPointVelocity);
            AVG_velocityArray.push(Math.average(velocityArray));
            STD_velocityArray.push(Math.standardDeviation(velocityArray));

            numberOfCardsWorkedArray.push(sprints[i].logsAnalysis.cards.length);

            numberOfCommitsArray.push(sprints[i].logsAnalysis.logObjects.length);
            AVG_numberOfCommitsArray.push(Math.average(numberOfCommitsArray));
            STD_numberOfCommitsArray.push(Math.standardDeviation(numberOfCommitsArray));


            var cPc = sprints[i].logsAnalysis.cards.length!=0 ? (sprints[i].logsAnalysis.logObjects.length/sprints[i].logsAnalysis.cards.length) : 0;
            numberOfCommitsPerCardArray.push(cPc);



            numberOfAuthorsArray.push(sprints[i].logsAnalysis.authors.length);
            var rollingAvg = sprints[i].logsAnalysis.logObjects[0] ? 1*sprints[i].logsAnalysis.logObjects[0].deltas.rollingAverageMs : 0;
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
        AVG_numberOfCommitsArray.reverse();
        STD_numberOfCommitsArray.reverse();
        numberOfCommitsPerCardArray.reverse();
        numberOfAuthorsArray.reverse();
        avgCommitFreqArray.reverse();
        velocityArray.reverse();
        AVG_velocityArray.reverse();


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
            storyPoints_misestimation_PerCardArray.push(-mesp);
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
            misestimationIndexArray.push(-(std !=0 ? ((cPc-avg) / std) : 0));
        }

        for(var i=0; i<misestimationIndexArray.length; i++) {
            combinedMisestimationIndexArray.push(misestimationIndexArray[i]+storyPoints_misestimation_PerCardArray[i]);
        }

        PREDICTED_velocityArray.push(0);
        PREDICTED_velocityArray_top.push(0);
        PREDICTED_velocityArray_bottom.push(0);
        var predictionVariance = [0];
        for(var i=1; i<velocityArray.length; i++) {
            // +++++++++++++++
            //prediction +++++
            // +++++++++++++++
            var INDEX = i;
            var PREVIOUS_INDEX = i-1;
            var p = (numberOfCommitsArray[PREVIOUS_INDEX] - AVG_numberOfCommitsArray[PREVIOUS_INDEX]) / AVG_numberOfCommitsArray[PREVIOUS_INDEX];
            var prediction1 = (1 + p) * AVG_velocityArray[PREVIOUS_INDEX];
            var prediction2 = numberOfCardsMergedArray[PREVIOUS_INDEX] * overallAVG_StoryPointsPerCardArray[PREVIOUS_INDEX];
            var predictionV = velocityArray[PREVIOUS_INDEX];
            predictionVariance.push(Math.abs(PREDICTED_velocityArray[PREVIOUS_INDEX] - velocityArray[PREVIOUS_INDEX]) / velocityArray[PREVIOUS_INDEX]);
            var makeupPrediction = Math.average(AVG_velocityArray);
            if(i>=2){
                var PREPRE_INDEX = PREVIOUS_INDEX-1;
                var m = -((velocityArray[PREVIOUS_INDEX] - velocityArray[PREPRE_INDEX]) / velocityArray[PREPRE_INDEX]);
                makeupPrediction *= (1 + m);
            }



            var Cp1 = (numberOfCommitsArray[INDEX] - AVG_numberOfCommitsArray[INDEX]) / AVG_numberOfCommitsArray[INDEX];
            var Cprediction3 = (1 + Cp1) * AVG_velocityArray[INDEX];
            var Cprediction4 = numberOfCardsMergedArray[INDEX] * overallAVG_StoryPointsPerCardArray[INDEX];

            var overallPrediction = Math.averageByWeight([
                                                     { value: Math.average(AVG_velocityArray),  multiplier:20 },
                                                     { value: makeupPrediction,  multiplier: 30 },
                                                     { value: Math.average(AVG_velocityArray),  multiplier:10 },
                                                     { value: prediction1, multiplier:10 },
                                                     { value: prediction2, multiplier:10 },
                                                     { value: predictionV, multiplier:10 },
                                                     { value: Cprediction3, multiplier:3 },
                                                     { value: Cprediction4, multiplier:2 }
                                                 ]);
            PREDICTED_velocityArray.push(overallPrediction);

            var averagePredictionVariance = Math.average(predictionVariance);
            var stdMultiplier = 1 + averagePredictionVariance;
            var averageVelocitySTD = Math.average(STD_velocityArray);
            PREDICTED_velocityArray_top.push(overallPrediction + (stdMultiplier * averageVelocitySTD));
            PREDICTED_velocityArray_bottom.push(overallPrediction - (stdMultiplier * averageVelocitySTD));


            // +++++++++++++++
            // +++++++++++++++
            // +++++++++++++++
        }
        var noMarker = {
            enabled : false
        };
        $scope.sprintNames = sprintNames;
        $scope.series = [];
        $scope.series.push({ data: misestimationIndexArray, name:"Misestimation Index",                                  type: "column", yAxis: 4, color: '#CCCCCC', marker : noMarker});
        if($scope.glimrData.jiraIntegrated) {
            $scope.series.push({ data: storyPoints_misestimation_PerCardArray, name:"Story Points Misestimation Index",     type: "column", yAxis: 4, color: '#FFCCEE', marker : noMarker});
            $scope.series.push({ data: combinedMisestimationIndexArray, name:"Combined Misestimation Index",                type: "column", yAxis: 4, color: '#CCCCFF', marker : noMarker});
        }
        $scope.series.push({ data: numberOfCardsMergedArray, name:"Cards Merged",                                       type: "spline", yAxis: 0, color: '#000000', marker : noMarker});
        $scope.series.push({ data: numberOfCommitsArray, name:"Commits",                                                type: "spline", yAxis: 1, color: '#00ff00', marker : noMarker});
        $scope.series.push({ data: avgCommitFreqArray, name:"Average Commit Freq.",                       type: "spline", yAxis: 2, color: '#0000ff', marker : noMarker});
        $scope.series.push({ data: numberOfCommitsPerCardArray, name:"Commits Per Card",                  type: "spline", yAxis: 3, color: '#00e6e6', marker : noMarker});
        $scope.series.push({ data: AVG_numberOfCommitsPerCardArray, name:"Avg. Commits Per Card",         type: "spline", yAxis: 3, color: '#008888', marker : noMarker});
        $scope.series.push({ data: STD_ABOVE_numberOfCommitsPerCardArray, name:"+1std Commits Per Card",  type: "spline", yAxis: 3, color: '#AAAAAA', marker : noMarker});
        $scope.series.push({ data: STD_BELOW_numberOfCommitsPerCardArray, name:"-1std Commits Per Card",  type: "spline", yAxis: 3, color: '#DDDDDD', marker : noMarker});
        $scope.series.push({ data: numberOfAuthorsArray, name:"Unique Authors",                           type: "spline", yAxis: 5, color: '#ff8811', marker : noMarker});
        if($scope.glimrData.jiraIntegrated) {
            $scope.series.push({ data: velocityArray, name:"Story Point Velocity",                                          type: "spline", yAxis: 6, color: '#FF4111', marker : noMarker});
            $scope.series.push({ data: AVG_velocityArray, name:"Avg. Story Point Velocity",                                 type: "spline", yAxis: 6, color: '#AA4155', marker : noMarker});

            $scope.series.push({ data: PREDICTED_velocityArray_top, name:"Predicted Story Point Velocity Top",                       type: "spline", yAxis: 6, color: '#FFA2EF', marker : { enabled : false }});
            $scope.series.push({ data: PREDICTED_velocityArray, name:"Predicted Story Point Velocity",                               type: "spline", yAxis: 6, color: '#AB42DE', marker : { enabled : true }});
            $scope.series.push({ data: PREDICTED_velocityArray_bottom, name:"Predicted Story Point Velocity Bottom",                 type: "spline", yAxis: 6, color: '#FFA2EF', marker : { enabled : false }});

            $scope.series.push({ data: avgStoryPointsPerCardArray, name:"Avg. Story Points Per Card",                         type: "spline", yAxis: 6, color: '#FF6699', marker : noMarker});
            $scope.series.push({ data: overallAVG_StoryPointsPerCardArray, name:"Overall Avg. Story Points Per Card",         type: "spline", yAxis: 6, color: '#666666', marker : noMarker});
            $scope.series.push({ data: overallSTD_above_StoryPointsPerCardArray, name:"Overall +1std Story Points Per Card",  type: "spline", yAxis: 6, color: '#333333', marker : noMarker});
            $scope.series.push({ data: overallSTD_below_StoryPointsPerCardArray, name:"Overall -1std Story Points Per Card",  type: "spline", yAxis: 6, color: '#999999', marker : noMarker});
        }
        $scope.seriesViewProfiles = [];

        if($scope.glimrData.jiraIntegrated) {
            $scope.seriesViewProfiles.push(["Story Point Velocity", "Predicted Story Point Velocity", "Commits", "Misestimation Index"]);

            $scope.seriesViewProfiles.push(["Story Point Velocity",
                                "Predicted Story Point Velocity", "Predicted Story Point Velocity Top", "Predicted Story Point Velocity Bottom"]);
            $scope.seriesViewProfiles.push(["Story Point Velocity",  "Predicted Story Point Velocity",
                                    "Cards Merged", "Misestimation Index", "Commits"]);
            $scope.seriesViewProfiles.push(["Story Point Velocity", "Avg. Story Point Velocity", "Avg. Story Points Per Card",
                                    "Overall Avg. Story Points Per Card", "Story Points Misestimation Index"]);
            $scope.seriesViewProfiles.push(["Story Point Velocity", "Cards Merged", "Story Points Misestimation", "Misestimation Index"]);
            $scope.seriesViewProfiles.push(["Commits Per Card", "Avg. Story Points Per Card", "Misestimation Index"]);
            $scope.seriesViewProfiles.push(["Cards Merged", "Story Point Velocity", "Misestimation Index"]);
            $scope.seriesViewProfiles.push(["Commits Per Card", "Story Point Velocity", "Commits"]);
            $scope.seriesViewProfiles.push(["Commits Per Card", "Avg. Commits Per Card", "+1std Commits Per Card", "-1std Commits Per Card", "Misestimation Index"]);
            $scope.seriesViewProfiles.push(["Cards Merged", "Average Commit Freq.", "Unique Authors"]);
            $scope.seriesViewProfiles.push(["Cards Merged", "Commits", "Unique Authors"]);
        } else {
            $scope.seriesViewProfiles.push(["Cards Merged", "Commits", "Misestimation Index"]);
            $scope.seriesViewProfiles.push(["Commits Per Card", "Commits", "Misestimation Index"]);
            $scope.seriesViewProfiles.push(["Commits Per Card", "Avg. Commits Per Card", "+1std Commits Per Card", "-1std Commits Per Card", "Misestimation Index"]);
            $scope.seriesViewProfiles.push(["Cards Merged", "Average Commit Freq.", "Unique Authors"]);
            $scope.seriesViewProfiles.push(["Cards Merged", "Commits", "Unique Authors"]);
        }

        $scope.setVisibleAllSeries(false);
        $scope.applySeriesViewProfile($scope.seriesViewProfiles[$scope.seriesViewProfileIndex]);

    }, $scope);


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
