module.exports = function(nit) {
    //
    var C = {};
    //

    C.commitFrequencyData = function(commitFrequencyData) {
        var self = this;
        var allAvg = self.createFlatSeries("Average", commitFrequencyData.all.average, commitFrequencyData.all.N);
        var allStdev = self.createFlatSeries("Stdev", commitFrequencyData.all.stdev, commitFrequencyData.all.N);

        var trendAvg = self.createFlatSeries("Last " + commitFrequencyData.trending.count + " Average", commitFrequencyData.trending.average, commitFrequencyData.trending.count);
        var trendStdev = self.createFlatSeries("Last " + commitFrequencyData.trending.count + " Stdev", commitFrequencyData.trending.stdev, commitFrequencyData.trending.count);
        var trendAvg = self.frontFill(trendAvg, commitFrequencyData.all.N - commitFrequencyData.trending.count);
    };

    C.createFlatSeries = function(name, value, numberEntries){
        var series = {
            name : name,
            data : []
        };
        for(var i=0; i<N; i++) {
            series.data[series.data.length] = value;
        }
        return series;
    }

    C.frontFill = function(series, N) {
        for(var i=0; i<N; i++) {
            series.data.unshift(undefined);
        }
        return series;
    }

    return C;
};