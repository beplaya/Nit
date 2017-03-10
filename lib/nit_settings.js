module.exports = function NitSettings() {
    if(!(this instanceof NitSettings)) {
        return new NitSettings();
    }
    this.defaultSettings = {
       projectKey : "DEFAULT_PROJECT_KEY",
       jira : {
           host : "???",
           boardName : "???",
           sprintVelocityJQL : "project={{projectKey}} AND Sprint='{{sprintName}}' AND status=Accepted",
           issuesInSprintWithStatusJQL : "project={{projectKey}} AND Sprint='{{sprintName}}' AND status='{{status}}'",
           statuses : ["Ready For Development",
                      "Under Development",
                      "Blocked",
                      "Pull Requested",
                      "Accepted"]
       },
       featureBranchPrefix : "feature/",
       nerver : { port : 9000, team : { host: "localhost", port:9100}}
    };

    this.init = function() {
        var fs = require('fs');
        fs.writeFileSync("./.nitconfig", this.defaultSettings.toString());
    };

    this.load = function(){

        var settings = this.loadSettingsFromFile() || this.defaultSettings;
        // Default settings if null
        settings.jira = settings.jira || this.defaultSettings.jira;
        settings.jira.host = settings.jira.host || this.defaultSettings.jira.host;
        settings.jira.boardName = settings.jira.boardName || this.defaultSettings.jira.boardName;
        settings.jira.sprintVelocityJQL = settings.jira.sprintVelocityJQL || this.defaultSettings.jira.sprintVelocityJQL;
        settings.jira.issuesInSprintWithStatusJQL = settings.jira.issuesInSprintWithStatusJQL || this.defaultSettings.jira.issuesInSprintWithStatusJQL;
        settings.jira.statuses = settings.jira.statuses || this.defaultSettings.jira.statuses;
        settings.projectKey = settings.projectKey || this.defaultSettings.projectKey;
        settings.featureBranchPrefix = settings.featureBranchPrefix || this.defaultSettings.featureBranchPrefix;
        settings.nerver = settings.nerver || this.defaultSettings.nerver;
        settings.nerver.port = settings.nerver.port || this.defaultSettings.nerver.port;
        settings.nerver.team = settings.nerver.team || this.defaultSettings.nerver.team;
        settings.nerver.team.host = settings.nerver.team.host || this.defaultSettings.nerver.team.host;
        settings.nerver.team.port = settings.nerver.team.port || this.defaultSettings.nerver.team.port;
        //
        this.saveSettings(settings);
        settings.jiraPrefix = settings.projectKey + "-";
        settings.featurePrefix = settings.featureBranchPrefix + settings.jiraPrefix;
        return settings;
    };

    this.saveSettings = function(settings){
        var fs = require('fs');
        fs.writeFileSync("./.nitconfig", JSON.stringify(settings, null, 4));
    };


    this.loadSettingsFromFile = function(){
        var fs = require('fs');
        var filePath = "./.nitconfig";
        try{
            var data = fs.readFileSync(filePath);
        } catch(e) {
            console.log("Failed to load .nitconfig in current directory.");
            fs.writeFileSync("./.nitconfig", JSON.stringify(this.defaultSettings));
            console.log("\n\tCreated .nitconfig with default settings.\n");
            return this.defaultSettings;
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

    this.getGitUser = function(cb) {
        var gitUser = {name:"?", email:"?"};
        this.getGitConfig(function(out, error){
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

    this.getGitConfig = function(cb) {
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

}

