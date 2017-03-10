module.exports = function NitSettings() {
    if(!(this instanceof NitSettings)){
        return new NitSettings();
    }

    this.defaultSettings = {
       jira : {
           host : "???",
           projectKey : "DEFAULT_PROJECT_KEY"
       },
       featureBranchPrefix : "feature/"
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
        settings.jira.projectKey = settings.jira.projectKey || this.defaultSettings.jira.projectKey;
        settings.featureBranchPrefix = settings.featureBranchPrefix || this.defaultSettings.featureBranchPrefix;
        //
        settings.jiraPrefix = settings.jira.projectKey + "-";
        settings.featurePrefix = settings.featureBranchPrefix + settings.jiraPrefix;
        return settings;
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

    return this;
}

