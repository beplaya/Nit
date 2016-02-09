module.exports = function NitSettings() {
    var NETTINGS = {};
    NETTINGS.defaultSettings = {
       projectKey : "DEFAULT_PROJECT_KEY",
       jira : {
           host : "???",
       },
       featureBranchPrefix : "feature/",
       nerver : { port : 9000, team : { host: "localhost", port:9100}}
    };

    NETTINGS.init = function() {
        var fs = require('fs');
        fs.writeFileSync("./.nitconfig", NETTINGS.defaultSettings.toString());
    };

    NETTINGS.load = function(){

        var settings = NETTINGS.loadSettingsFromFile() || NETTINGS.defaultSettings;
        // Default settings if null
        settings.jira = settings.jira || NETTINGS.defaultSettings.jira;
        settings.jira.host = settings.jira.host || NETTINGS.defaultSettings.jira.host;
        settings.projectKey = settings.projectKey || NETTINGS.defaultSettings.projectKey;
        settings.featureBranchPrefix = settings.featureBranchPrefix || NETTINGS.defaultSettings.featureBranchPrefix;
        settings.nerver = settings.nerver || NETTINGS.defaultSettings.nerver;
        settings.nerver.port = settings.nerver.port || NETTINGS.defaultSettings.nerver.port;
        settings.nerver.team = settings.nerver.team || NETTINGS.defaultSettings.nerver.team;
        settings.nerver.team.host = settings.nerver.team.host || NETTINGS.defaultSettings.nerver.team.host;
        settings.nerver.team.port = settings.nerver.team.port || NETTINGS.defaultSettings.nerver.team.port;
        //
        NETTINGS.saveSettings(settings);
        settings.jiraPrefix = settings.projectKey + "-";
        settings.featurePrefix = settings.featureBranchPrefix + settings.jiraPrefix;
        return settings;
    };

    NETTINGS.saveSettings = function(settings){
        var fs = require('fs');
        fs.writeFileSync("./.nitconfig", JSON.stringify(settings, null, 4));
    };


    NETTINGS.loadSettingsFromFile = function(){
        var fs = require('fs');
        var filePath = "./.nitconfig";
        try{
            var data = fs.readFileSync(filePath);
        } catch(e) {
            console.log("Failed to load .nitconfig in current directory.");
            fs.writeFileSync("./.nitconfig", JSON.stringify(NETTINGS.defaultSettings));
            console.log("\n\tCreated .nitconfig with default settings.\n");
            return NETTINGS.defaultSettings;
        }
        var content = data ? data : "{}";
        var json = {};
        try {
            var json = JSON.parse(content);
        } catch(e){
            console.log("NError! Invalid .nitconfig!  Parse error. See (nitconfig_template.txt)");
            console.log(e);
        }
        return json;
    };

    NETTINGS.getGitUser = function(cb) {
        var gitUser = {name:"?", email:"?"};
        NETTINGS.getGitConfig(function(out, error){
            var lines = out.split("\n");
            for(var i=0; i<lines.length; i++) {
                if(lines[i].indexOf("user.name=")!=-1){
                    gitUser.name = lines[i].replace("user.name=", "").trim();
                }else if(lines[i].indexOf("user.email=")!=-1){
                    gitUser.email = lines[i].replace("user.email=", "").trim();
                }
            }
            cb && cb(gitUser);
        });
    };

    NETTINGS.getGitConfig = function(cb) {
         var spawn = require('child_process').spawn,
         ls = spawn("git", ["config", "--list"]);
         var out = "";
         var error = false;
         ls.stdout.on('data', function (data) {
             out += "\n" + (data ? data.toString() : "");
         });
         ls.stderr.on('data', function (data) {
             console.log(error);
             out += "\n" + (data ? data.toString() : "");
         });

         ls.on('close', function (code) {
             cb && cb(out, error);
         });
     };

    return NETTINGS;
}

