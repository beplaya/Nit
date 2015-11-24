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
                data : commitFrequencyData.all.deltas.full.map(function(d) { return d.value; }).reverse()
            }
        };

        var chart = self.baseCharts.commitFrequencyData(commitFrequencyData.all.deltas.full, commitFrequencyData.all.average.millis, commitFrequencyData.all.stdev.millis);
        series.allAvg.color = "#f00";
        series.allStdevP.color = "#fAA";
        series.allStdevM.color = "#fAA";
        series.trailingAvg.color = "#00f";
        series.trailingStdevP.color = "#AAf";
        series.trailingStdevM.color = "#AAf";
        series.deltas.color = "#DDD";
        chart.series = [
                series.deltas,
                series.allAvg,
                series.allStdevP,
                series.allStdevM,
                series.trailingAvg,
                series.trailingStdevP,
                series.trailingStdevM,
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
        commitFrequencyData : function(entries, avg, stdev) {
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
                    categories: entries.map(function(entry){ return entry.value; }).reverse()
                },
                yAxis: {
                    max : avg + (3*stdev),
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