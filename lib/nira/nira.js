module.exports = function Nira(nettings) {
    if(!(this instanceof Nira)) {
        return new Nira(nettings);
    }
    this.nettings = nettings;
    this.baseURL = "https://" + this.nettings.jira.host + "/browse/";
    this.issueCacher = new require(__dirname + '/issue_cacher.js')();

    this.login = function(username, password, cb) {
        var self = this;
        self.basicAuth = new Buffer(username + ":" + password).toString('base64');
        self.authorize(function(data, statusCode){
            var loggedin = statusCode && statusCode != 404 && statusCode != 401 && statusCode != "401";
            if(loggedin){
                self.getFields(function(fields) {
                    cb && cb(loggedin);
                });
            }else {
                cb && cb(loggedin);
            }
        });
    };

    this.getFields = function(cb) {
        var self = this;
        var options = self.getOptions("field");
        self.GET(options, function(data, statusCode){
            self.fields = data;
            cb && cb();
        });
    };

    this.getSprintStoryPointVelocity = function(projectKey, sprintName, cb) {
        var self = this;
        var qs = require('querystring');
        var storyPointsFieldId = self.getStoryPointsFieldId();
        //e.g. project={{projectKey}} AND Sprint='{{sprintName}}' AND status=Accepted
        var jql = self.nettings.jira.sprintVelocityJQL.replace(/{{projectKey}}/g, projectKey);
        jql = jql.replace(/{{sprintName}}/g, sprintName);
        var options = self.getOptions("search?jql=" + qs.escape(jql));
        self.GET(options, function(data, statusCode){
            var sprintStoryPointVelocity = 0;
            var issues = data.issues;
            issues = issues ? issues : [];
            for(var i=0; i<issues.length; i++) {
                sprintStoryPointVelocity += issues[i].fields[storyPointsFieldId]*1;
            }
            console.log("END getSprintStoryPointVelocity", "spvel=", sprintStoryPointVelocity, storyPointsFieldId, projectKey, sprintName);

            cb && cb(projectKey, sprintName, sprintStoryPointVelocity);
        });
    };

    this.getStoryPointsFieldId = function(){
        var self = this;
        var storyPointsFieldId = "";
        for(var i=0; i<self.fields.length; i++) {
            if(self.fields[i].name === "Story Points") {
                storyPointsFieldId = self.fields[i].id;
            }
        }
        return storyPointsFieldId;
    };

    this.getSprintFineDetails = function(projectKey, sprintName, cb) {
        var self = this;
        var qs = require('querystring');
        var storyPointsFieldId = self.getStoryPointsFieldId();
        var jql = self.nettings.jira.issuesInSprintWithStatusJQL;
        jql = jql.replace(/{{projectKey}}/g, projectKey);
        jql = jql.replace(/{{sprintName}}/g, sprintName);

        var statuses = self.nettings.jira.statuses;

        var statusObjects = [];
        for(var i=0; i<statuses.length; i++) {
            statusObjects[statuses[i]] = {
                status : statuses[i],
                jql : qs.escape(jql.replace(/{{status}}/g, statuses[i])),
                numberOfIssues : 0,
                storyPoints : 0
            };
        }
        self._recurseStatuses(0, statuses, statusObjects, storyPointsFieldId, function(statusObjects){
            var data = {
                statusObjects : [],
                projectKey : projectKey,
                sprintName : sprintName
            };
            for(var i=0; i<statuses.length; i++) {
                data.statusObjects.push({
                    status : statusObjects[statuses[i]].status,
                    numberOfIssues : statusObjects[statuses[i]].numberOfIssues,
                    storyPoints : statusObjects[statuses[i]].storyPoints
                });
            }
            cb && cb(data);
        });
    };

    this._recurseStatuses = function(statusIndex, statuses, statusObjects, storyPointsFieldId, cb) {
        var self = this;
        var jiraStatus = statuses[statusIndex];
        self.GET(self.getOptions("search?jql=" + statusObjects[jiraStatus].jql),
            function(data, statusCode){
                var issues = data.issues;
                issues = issues ? issues : [];
                statusObjects[jiraStatus].numberOfIssues = issues.length;
                statusObjects[jiraStatus].storyPoints = 0;
                for(var i=0; i<issues.length; i++) {
                    statusObjects[jiraStatus].storyPoints += issues[i].fields[storyPointsFieldId]*1;
                }
                statusIndex++;
                if(statusIndex < statuses.length){
                    self._recurseStatuses(statusIndex, statuses, statusObjects, storyPointsFieldId, cb);
                } else {
                    cb && cb(statusObjects);
                }
            });
    };

    this.authorize = function(cb){
        var self = this;
        var options = self.getOptions("");
        options.path = "/rest/auth/1/session";
        console.log("Logging into https://" + self.nettings.jira.host);
        self.GET(options, cb);
    };

    this.getOptions = function(path, prefix){
        var self = this;

         prefix = prefix || "/rest/api/2/";
         return {
                    host: self.nettings.jira.host,
                    port: 443,
                    path : prefix + path,
                    headers: { "Content-Type": "application/json", "Authorization": "Basic "+self.basicAuth }
                };
    };

    this.getIssue = function(issueID, cb) {
        var self = self;
        var issueData = self.issueCacher.getCachedIssue(issueID);

        if(issueData){
            cb && cb(issueData);
        } else {
            var options = self.getOptions('issue/' + issueID);
            self.GET(options, function(data, statusCode){
                if(statusCode===200){
                    self.issueCacher.cacheIssue(issueID, data);
                }
                cb && cb(data);
            });
        }
    };

    this.getCurrentSprintForCurrentProject = function(cb) {
        var self = this;
        self.getCurrentSprint(self.nettings.projectKey, self.nettings.jira.boardName, cb);
    };

    this.getCurrentSprint = function(projectKey, boardName, cb) {
       var self = this;
       self.listSprints(projectKey, boardName, function(sprints) {
            self._recurseAndFindCurrentSprint(0, sprints, function(allSprints){
                var currentSprint = undefined;
                var filteredSprints = [];
                for(var i=0; i<allSprints.length; i++) {
                    if(allSprints[i].isCurrent){
                        currentSprint = allSprints[i];
                    }
                    if(allSprints[i].valid){
                        filteredSprints.push(allSprints[i]);
                    }
                }
                cb && cb(filteredSprints, currentSprint);
            });
       });
    };

    this._sprintIsCurrent = function(sprint) {
        var self = this;
        try {
            var now = new Date().getTime();
            var startTimeMs = new Date(sprint.startDate).getTime();
            var endTimeMs = new Date(sprint.endDate).getTime();
            return startTimeMs<=now && endTimeMs>=now;
        }catch(e){
            console.log(e);
            return false;
        }
    };

    this._recurseAndFindCurrentSprint = function(index, sprints, cb) {
        var self = this;
        self.getSprint(sprints[index].id, function(sprint){
            if(sprint) {
                sprints[index] = sprint;
                sprints[index].valid = true;
            } else {
                console.log("couldn't find sprint: " + JSON.stringify(sprints[index], 0, 4));
                sprints[index].valid = false;
            }
            sprints[index].isCurrent = false;
            if(self._sprintIsCurrent(sprint)) {
                sprints[index].isCurrent = true;
            }

            if(index < (sprints.length-1)){
                index++;
                self._recurseAndFindCurrentSprint(index, sprints, cb);
            } else {
                cb && cb(sprints);
            }
         });
    };

    this.getSprint = function(sprintId, cb){
        var self = this;
        var sprint = undefined;
        var options = self.getOptions("sprint/" + sprintId + "/edit/model", "/rest/greenhopper/1.0/");
        self.GET(options, function(data, statusCode){
            try {
                sprint = data.sprint;
            } catch (e){
                sprint = undefined;
            }
            cb && cb(sprint)
        });
    };

    this.listSprints = function(projectKey, boardName, cb){
        var self = this;
        var sprints = [];
        self.getRapidViewId(projectKey, boardName, function(rapidViewId){
            var options = self.getOptions("sprintquery/" + rapidViewId, "/rest/greenhopper/1.0/");
            self.GET(options, function(data, statusCode){
                try {
                    sprints = data.sprints;
                } catch (e){
                    console.log(e);
                    sprints = [];
                }
                cb && cb(sprints)
            });
        });
    };

    this.getRapidViewId = function(projectKey, boardName, cb){
        var self = self;
        var rapidViewId = undefined;
        self.listRapidViews(function(data, statusCode){
            var projectKey = self.nettings.projectKey;
            var views = (data && data.views) ? data.views : [];

            for(var i=0; i<views.length; i++) {
                var id = views[i].id;
                var name = views[i].name;
                try{
                    var filter = views[i].filter;
                    if(name.toLowerCase().trim() == boardName.toLowerCase().trim() && filter.queryProjects.projects[0].key == projectKey)
                    {
                        rapidViewId = id;
                        break;
                    }
                }catch(e){
                    console.log(e);
                    rapidViewId = undefined;
                }
            }
            cb && cb(rapidViewId);
        });
    };

    this.listRapidViews = function(cb){
        var self = this;
        var options = self.getOptions("rapidviews/list", "/rest/greenhopper/1.0/");
        self.GET(options, function(data, statusCode){
            cb && cb(data, statusCode);
        });
    };

    this.GET = function(options, cb) {
        var self = self;
        var data = "";
        var https = require('https');

        options.method = "GET";
        var req = https.request(options, function(res) {

            res.on('data', function(d) {
                data +=d;
            });
            res.on('end', function(){
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    data = {error:e};
                }
                cb && cb(data, res.statusCode);
            });
        });

        req.end();

        req.on('error', function(e) {
          cb && cb({error:e}, 404);
        });
    };

    this.POST = function(options, postData, cb) {
        var self = this;
        postData = JSON.stringify(postData);
        var data = "";
        var https = require('https');
        options.method = "POST";
        options.headers['Content-Length'] = Buffer.byteLength(postData);
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(d) {
                data +=d;
            });
            res.on('end', function(){
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    data = {error:e};
                }
                cb && cb(data);
            });
        });
        req.write(postData);
        req.end();

        req.on('error', function(e) {
          cb && cb({error:e});
        });
    };

    this.getDescription = function(issueID, data, cb) {
        var self = this;
        self.getIssue(issueID, function(data){
            try {
                var F = data.fields;
                cb && cb(F);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };

    this.getComments = function(issueID, data, cb) {
        var self = this;
        this.getIssue(issueID, function(data){
            try {
                cb && cb(data.fields.comment);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };

    this.createComment = function(issueID, comment, cb){
        var self = this;
        comment = {
            body : comment
        };
        var options = self.getOptions('issue/' + issueID + '/comment');
        self.POST(options, comment, function(data){
            cb && cb();
        });
    };

    this.ticketIDFromBranch = function(b){
        var self = this;
        return b.replace(self.nettings.featurePrefix, self.nettings.jiraPrefix).trim();
    };

    this.clearCache = function(issueID){
        this.issueCacher.clearCache(issueID);
    };
}
