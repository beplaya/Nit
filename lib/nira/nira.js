module.exports = function Nira(nettings) {
    if(!(this instanceof Nira)) {
        return new Nira(nettings);
    }
    this.nettings = nettings;
    this.baseURL = "https://" + this.nettings.jira.host + "/browse/";
    this.issueCacher = new require(__dirname + '/issue_cacher.js')();

    this.login = function(username, password, cb) {
        this.basicAuth = new Buffer(username + ":" + password).toString('base64');
        this.authorize(function(data, statusCode){
            var loggedin = statusCode && statusCode != 404 && statusCode != 401 && statusCode != "401";
            if(loggedin){
                this.getFields(function(fields) {
                    cb && cb(loggedin);
                });
            }else {
                cb && cb(loggedin);
            }
        });
    };

    this.getFields = function(cb) {
        var options = this.getOptions("field");
        this.GET(options, function(data, statusCode){
            this.fields = data;
            cb && cb();
        });
    };

    this.getSprintStoryPointVelocity = function(projectKey, sprintName, cb) {
        var qs = require('querystring');
        var storyPointsFieldId = this.getStoryPointsFieldId();
        //e.g. project={{projectKey}} AND Sprint='{{sprintName}}' AND status=Accepted
        var jql = this.nettings.jira.sprintVelocityJQL.replace(/{{projectKey}}/g, projectKey);
        jql = jql.replace(/{{sprintName}}/g, sprintName);
        var options = this.getOptions("search?jql=" + qs.escape(jql));
        this.GET(options, function(data, statusCode){
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
        var storyPointsFieldId = "";
        for(var i=0; i<this.fields.length; i++) {
            if(this.fields[i].name === "Story Points") {
                storyPointsFieldId = this.fields[i].id;
            }
        }
        return storyPointsFieldId;
    };

    this.getSprintFineDetails = function(projectKey, sprintName, cb) {
        var qs = require('querystring');
        var storyPointsFieldId = this.getStoryPointsFieldId();
        var jql = this.nettings.jira.issuesInSprintWithStatusJQL;
        jql = jql.replace(/{{projectKey}}/g, projectKey);
        jql = jql.replace(/{{sprintName}}/g, sprintName);

        var statuses = this.nettings.jira.statuses;

        var statusObjects = [];
        for(var i=0; i<statuses.length; i++) {
            statusObjects[statuses[i]] = {
                status : statuses[i],
                jql : qs.escape(jql.replace(/{{status}}/g, statuses[i])),
                numberOfIssues : 0,
                storyPoints : 0
            };
        }
        this._recurseStatuses(0, statuses, statusObjects, storyPointsFieldId, function(statusObjects){
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
        var jiraStatus = statuses[statusIndex];
        this.GET(this.getOptions("search?jql=" + statusObjects[jiraStatus].jql),
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
                    this._recurseStatuses(statusIndex, statuses, statusObjects, storyPointsFieldId, cb);
                } else {
                    cb && cb(statusObjects);
                }
            });
    };

    this.authorize = function(cb){
        var options = this.getOptions("");
        options.path = "/rest/auth/1/session";
        console.log("Logging into https://" + this.nettings.jira.host);
        this.GET(options, cb);
    };

    this.getOptions = function(path, prefix){
         prefix = prefix || "/rest/api/2/";
         return {
                    host: this.nettings.jira.host,
                    port: 443,
                    path : prefix + path,
                    headers: { "Content-Type": "application/json", "Authorization": "Basic "+this.basicAuth }
                };
    };

    this.getIssue = function(issueID, cb) {
        var issueData = this.issueCacher.getCachedIssue(issueID);

        if(issueData){
            cb && cb(issueData);
        } else {
            var options = this.getOptions('issue/' + issueID);
            this.GET(options, function(data, statusCode){
                if(statusCode===200){
                    this.issueCacher.cacheIssue(issueID, data);
                }
                cb && cb(data);
            });
        }
    };

    this.getCurrentSprintForCurrentProject = function(cb) {
        this.getCurrentSprint(this.nettings.projectKey, this.nettings.jira.boardName, cb);
    };

    this.getCurrentSprint = function(projectKey, boardName, cb) {
       this.listSprints(projectKey, boardName, function(sprints) {
            this._recurseAndFindCurrentSprint(0, sprints, function(allSprints){
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
         this.getSprint(sprints[index].id, function(sprint){
            if(sprint) {
                sprints[index] = sprint;
                sprints[index].valid = true;
            } else {
                console.log("couldn't find sprint: " + JSON.stringify(sprints[index], 0, 4));
                sprints[index].valid = false;
            }
            sprints[index].isCurrent = false;
            if(this._sprintIsCurrent(sprint)) {
                sprints[index].isCurrent = true;
            }

            if(index < (sprints.length-1)){
                index++;
                this._recurseAndFindCurrentSprint(index, sprints, cb);
            } else {
                cb && cb(sprints);
            }
         });
    };

    this.getSprint = function(sprintId, cb){
        var sprint = undefined;
        var options = this.getOptions("sprint/" + sprintId + "/edit/model", "/rest/greenhopper/1.0/");
        this.GET(options, function(data, statusCode){
            try {
                sprint = data.sprint;
            } catch (e){
                sprint = undefined;
            }
            cb && cb(sprint)
        });
    };

    this.listSprints = function(projectKey, boardName, cb){
        var sprints = [];
        this.getRapidViewId(projectKey, boardName, function(rapidViewId){
            var options = this.getOptions("sprintquery/" + rapidViewId, "/rest/greenhopper/1.0/");
            this.GET(options, function(data, statusCode){
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
        var rapidViewId = undefined;
        this.listRapidViews(function(data, statusCode){
            var projectKey = this.nettings.projectKey;
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
        var options = this.getOptions("rapidviews/list", "/rest/greenhopper/1.0/");
        this.GET(options, function(data, statusCode){
            cb && cb(data, statusCode);
        });
    };

    this.GET = function(options, cb) {
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
        this.getIssue(issueID, function(data){
            try {
                var F = data.fields;
                cb && cb(F);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };

    this.getComments = function(issueID, data, cb) {
        this.getIssue(issueID, function(data){
            try {
                cb && cb(data.fields.comment);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };

    this.createComment = function(issueID, comment, cb){
        comment = {
            body : comment
        };
        var options = this.getOptions('issue/' + issueID + '/comment');
        this.POST(options, comment, function(data){
            cb && cb();
        });
    };

    this.ticketIDFromBranch = function(b){
        return b.replace(this.nettings.featurePrefix, this.nettings.jiraPrefix).trim();
    };

    this.clearCache = function(issueID){
        this.issueCacher.clearCache(issueID);
    };
}
