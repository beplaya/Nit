module.exports = function() {
    //
    var C = {};
    //

    C.commitFrequencyData = function(commitFrequencyData) {
        var self = this;
        var N = commitFrequencyData.all.deltas.full.length;
        var series = {
            allAvg : self.createFlatSeries("Average", commitFrequencyData.all.average.millis, N),
            allStdevP : self.createFlatSeries("Stdev+", commitFrequencyData.all.average.millis+commitFrequencyData.all.stdev.millis, N),
            allStdevM : self.createFlatSeries("Stdev-", commitFrequencyData.all.average.millis-commitFrequencyData.all.stdev.millis, N),

            trailingAvg : self.createFlatSeries("Last " + commitFrequencyData.trailing.count + " Average", commitFrequencyData.trailing.average.millis, N),
            trailingStdevP : self.createFlatSeries("Last " + commitFrequencyData.trailing.count + " Stdev+", commitFrequencyData.trailing.average.millis+commitFrequencyData.trailing.stdev.millis, N),
            trailingStdevM : self.createFlatSeries("Last " + commitFrequencyData.trailing.count + " Stdev-", commitFrequencyData.trailing.average.millis-commitFrequencyData.trailing.stdev.millis, N),

            deltas : {
                name : "Time Between Commits",
                data : commitFrequencyData.all.deltas.full.map(function(d) { return d.value; })
            },

            dailyMovingAverage : {
                name : "dailyMovingAverage",
                data : []
            },

            weeklyMovingAverage : {
                name: "weeklyMovingAverage",
                data : []
            },

            smooth : {
                name: "smooth",
                data: []
            }
        };
        var dmaData = commitFrequencyData.all.dailyMovingAverage.reverse();
        var dmaChartData = [];
        for(var i=0; i<dmaData.length; i++) {
            var value = dmaData[i].average;
            for(var j=0; j<dmaData[i].N; j++){
                dmaChartData.push(value);
            }
        }
        series.dailyMovingAverage.data = dmaChartData;
        var wmaData = commitFrequencyData.all.weeklyMovingAverages.reverse();
        var wmaChartData = [];
        for(var i=0; i<wmaData.length; i++) {
            var value = wmaData[i].average;
            for(var j=0; j<wmaData[i].DN; j++){
                wmaChartData.push(value);
            }
        }
        series.weeklyMovingAverage.data = wmaChartData;

        var smoothData = [];
        var smoothChartData = [];
        var smoothIndex = -1;
        var smoothFactor = Math.floor(.1*series.deltas.data.length);
        var largest = 0;
        for(var i=0; i<series.deltas.data.length; i++) {
            if(i%smoothFactor == 0){
               smoothIndex++;
            }
            if(!smoothData[smoothIndex]){
                smoothData[smoothIndex] = {N:0, sum:0, average:0};
            }
            smoothData[smoothIndex].sum += series.deltas.data[i];
            smoothData[smoothIndex].N++;
            smoothData[smoothIndex].average =  smoothData[smoothIndex].sum /  smoothData[smoothIndex].N;
        }
        for(var i=0; i<smoothData.length; i++) {
            var value = smoothData[i].average;
            if(largest<value) {
                largest = value;
            }
            for(var j=0; j<smoothData[i].N; j++){
                smoothChartData.push(value);
            }
        }
        series.smooth.data = smoothChartData;

        var chart = self.baseCharts.commitFrequencyData(commitFrequencyData.all.deltas.full, commitFrequencyData.all.average.millis, commitFrequencyData.all.stdev.millis, largest);
        series.allAvg.color = "#f00";
        series.allStdevP.color = "#fAA";
        series.allStdevM.color = "#fAA";
        series.trailingAvg.color = "#00f";
        series.trailingStdevP.color = "#AAf";
        series.trailingStdevM.color = "#AAf";
        series.deltas.color = "#DDD";
        series.dailyMovingAverage.color = "#0F0";
        series.weeklyMovingAverage.color = "#F0F";
        series.smooth.color = "#225";
        chart.series = [
                series.deltas,
                series.allAvg,
                series.allStdevP,
                series.allStdevM,
                series.trailingAvg,
                series.trailingStdevP,
                series.trailingStdevM,
                series.dailyMovingAverage,
                series.weeklyMovingAverage,
                series.smooth,
            ];
        return chart;
    };

    C.createFlatSeries = function(name, value, N){
        var series = {
            name : name,
            data : []
        };
        for(var i=0; i<N; i++) {
            series.data.push(value);
        }
        return series;
    };

    C.frontFill = function(series, N) {
        for(var i=0; i<N; i++) {
            series.data.unshift(undefined);
        }
        return series;
    };

    C.backFill = function(series, N) {
        for(var i=0; i<N; i++) {
            series.data.push(undefined);
        }
        return series;
    };

    C.baseCharts = {
        commitFrequencyData : function(entries, avg, stdev, largest) {
            return {
                title: {
                    text: 'Commit Frequency',
                    x: -20 //center
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'middle',
                    borderWidth: 0
                },
                xAxis: {
                    // categories: entries.map(function(entry){ return entry.value; }).reverse()
                    categories: []
                },
                yAxis: {
                    // max : avg + (3*stdev),
                    max : largest,
                    min : 0,
                    title: {
                        text: 'Time Between Commits (ms)'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                }
            };
        }
    };
    return C;
};