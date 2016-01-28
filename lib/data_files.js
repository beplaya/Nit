module.exports = function DataFiles() {
    var DF = {};
    DF.nettings = require(__dirname + '/nit_settings.js')().load();
    DF.fs = require('fs');

    DF.directories = {};
    DF.directories.webRoot = __dirname + "/../web";
    DF.directories.root = DF.directories.webRoot + "/project_cache";
    DF.directories.projectRoot = DF.directories.root + "/project_" + DF.nettings.jira.projectKey;
    DF.directories.json = DF.directories.projectRoot + "/json";

    DF.files = {
        status : "status.json",
        oneLineLogData : "one_line_log_data.json"
    };

    DF.writeStatusDataFile = function(statusData) {
        DF.writeFile(DF.directories.json + "/" + DF.files.status, statusData);
    };

    DF.writeOneLineLogFile = function(oneLineLogData){
        var lines = oneLineLogData.split('\n');
        var lineMessages = [];
        var largestLineMessageLength = 0;
        for(var i=0; i<lines.length; i++) {
            var words = lines[i].split(" ");
            var hash = words[0];
            if(hash.length > 0){
                var message = "";
                for(var j=1; j<words.length; j++) {
                    message += " " + words[j];
                }
                message = message.trim();
                var smallHash = hash.substring(0, 7);
                message = (i+1) + " | " + smallHash.verbose + " | - | " + message;
                lineMessages.push(message);
                if(message.length > largestLineMessageLength) {
                    largestLineMessageLength = message.length;
                }
            }
        }

        var file = DF.directories.json + "/" + DF.files.oneLineLogData;
        DF.writeFile(file, JSON.stringify(lineMessages));
    };

    DF.writeFile = function(file, data){
        DF.fs.writeFileSync(file, data);
    };

    DF.mkDirs = function(){
        DF.mkDir(DF.directories.webRoot);
        DF.mkDir(DF.directories.root);
        DF.mkDir(DF.directories.projectRoot);
        DF.mkDir(DF.directories.json);
    };

    DF.mkDir = function(dir){
        try {
            DF.fs.mkdirSync(dir);
        } catch(e){
            if(e.code !== "EEXIST"){
                console.log(e);
            }
        }
    }

    DF.mkDirs();

    return DF;
};