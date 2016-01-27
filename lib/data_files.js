module.exports = function DataFiles() {
    var DF = {};
    DF.fs = require('fs');

    DF.directories = {
        root : __dirname+"/data",
        json : __dirname+"/data/json"
    };

    DF.files = {
        status : "status.json",
        oneLineLogData : "one_line_log_data.json"
    };

    DF.writeStatusDataFile = function(statusData) {
        DF.fs.fs.mkdirSync(DF.directories.json);
        DF.writeFile(DF.directories.json + "/" + DF.files.status, statusData);
    };

    DF.writeOneLineLogFile = function(oneLineLogData){
        DF.fs.fs.mkdirSync(DF.directories.json);
        DF.writeFile(DF.directories.json + "/" + DF.files.oneLineLogData, oneLineLogData);
    };

    DF.writeFile = function(file, json){
        var content = JSON.stringify(statusData);
        DF.fs.writeFileSync(file, content);
    };

    return DF;
};