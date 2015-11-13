module.exports = function NitSettings() {
    var NETTINGS = {};
    NETTINGS.defaultSettings = {
       jira : {
           host : "???",
           projectKey : "DEFAULT_PROJECT_KEY"
       },
       featureBranchPrefix : "feature/"
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
        settings.jira.projectKey = settings.jira.projectKey || NETTINGS.defaultSettings.jira.projectKey;
        settings.featureBranchPrefix = settings.featureBranchPrefix || NETTINGS.defaultSettings.featureBranchPrefix;
        //
        settings.jiraPrefix = settings.jira.projectKey + "-";
        settings.featurePrefix = settings.featureBranchPrefix + settings.jiraPrefix;
        return settings;
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

    return NETTINGS;
}

