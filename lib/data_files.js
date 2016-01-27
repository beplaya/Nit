module.exports = function DataFiles() {
    var DF = {};
    DF.nettings = require(__dirname + '/nit_settings.js')().load();
    DF.fs = require('fs');

    DF.directories = {};
    DF.directories.root = "./web/project_cache";
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
        DF.writeFile(DF.directories.json + "/" + DF.files.oneLineLogData, oneLineLogData);
    };

    DF.writeFile = function(file, data){
        DF.fs.writeFileSync(file, data);
    };

    DF.mkDirs = function(){
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