module.exports = function Nira(nettings) {
    var NIRA = {};
    NIRA.nettings = nettings;
    NIRA.baseURL = "https://" + NIRA.nettings.jira.host + "/browse/";
    NIRA.issueCacher = require(__dirname + '/issue_cacher.js')();

    NIRA.login = function(username, password, cb) {
        NIRA.basicAuth = new Buffer(username + ":" + password).toString('base64');
        NIRA.authorize(function(data, statusCode){
            var loggedin = statusCode && statusCode != 404 && statusCode != 401 && statusCode != "401";
            if(loggedin){
                NIRA.getFields(function(fields) {
                    cb && cb(loggedin);
                });
            }else {
                cb && cb(loggedin);
            }
        });
    };

    NIRA.getFields = function(cb) {
        var options = NIRA.getOptions("field");
        NIRA.GET(options, function(data, statusCode){
            NIRA.fields = data;
            cb && cb();
        });
    };

    NIRA.getSprintStoryPointVelocity = function(projectKey, sprintName, cb) {
        var storyPointsFieldId = "";
        for(var i=0; i<NIRA.fields.length; i++) {
            if(NIRA.fields[i].name === "Story Points"){
                storyPointsFieldId = NIRA.fields[i].id;
            }
        }

        var qs = require('querystring');
        //e.g. project={{projectKey}} AND Sprint='{{sprintName}}' AND status=Accepted
        var jql = NIRA.nettings.jira.sprintVelocityJQL.replace(/{{projectKey}}/g, projectKey);
        jql = jql.replace(/{{sprintName}}/g, sprintName);
        var options = NIRA.getOptions("search?jql=" + qs.escape(jql));
        NIRA.GET(options, function(data, statusCode){
            var sprintStoryPointVelocity = 0;
            var issues = data.issues;
            for(var i=0; i<issues.length; i++) {
                sprintStoryPointVelocity += issues[i].fields[storyPointsFieldId]*1;
            }
            console.log("END getSprintStoryPointVelocity", "spvel=", sprintStoryPointVelocity, storyPointsFieldId, projectKey, sprintName);

            cb && cb(projectKey, sprintName, sprintStoryPointVelocity);
        });
    };

    NIRA.authorize = function(cb){
        var options = NIRA.getOptions("");
        options.path = "/rest/auth/1/session";
        console.log("Logging into https://" + NIRA.nettings.jira.host);
        NIRA.GET(options, cb);
    };

    NIRA.getOptions = function(path, prefix){
         prefix = prefix || "/rest/api/2/";
         return {
                    host: NIRA.nettings.jira.host,
                    port: 443,
                    path : prefix + path,
                    headers: { "Content-Type": "application/json", "Authorization": "Basic "+NIRA.basicAuth }
                };
    };

    NIRA.getIssue = function(issueID, cb) {
        var issueData = NIRA.issueCacher.getCachedIssue(issueID);

        if(issueData){
            cb && cb(issueData);
        } else {
            var options = NIRA.getOptions('issue/' + issueID);
            NIRA.GET(options, function(data, statusCode){
                if(statusCode===200){
                    NIRA.issueCacher.cacheIssue(issueID, data);
                }
                cb && cb(data);
            });
        }
    };

    NIRA.getCurrentSprintForCurrentProject = function(cb) {
        NIRA.getCurrentSprint(NIRA.nettings.projectKey, NIRA.nettings.jira.boardName, cb);
    };

    NIRA.getCurrentSprint = function(projectKey, boardName, cb) {
       NIRA.listSprints(projectKey, boardName, function(sprints) {
            NIRA._recurseAndFindCurrentSprint(0, sprints, function(allSprints){
                var currentSprint = undefined;
                for(var i=0; i<allSprints.length; i++) {
                    if(allSprints[i].isCurrent){
                        currentSprint = allSprints[i];
                        break;
                    }
                }
                cb && cb(allSprints, currentSprint);
            });
       });
    };

    NIRA._sprintIsCurrent = function(sprint) {
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

    NIRA._recurseAndFindCurrentSprint = function(index, sprints, cb) {
         NIRA.getSprint(sprints[index].id, function(sprint){
            sprints[index] = sprint;
            sprints[index].isCurrent = false;
            if(NIRA._sprintIsCurrent(sprint)) {
                sprints[index].isCurrent = true;
            }

            if(index < (sprints.length-1)){
                index++;
                NIRA._recurseAndFindCurrentSprint(index, sprints, cb);
            } else {
                cb && cb(sprints);
            }
         });
    };

    NIRA.getSprint = function(sprintId, cb){
        var sprint = undefined;
        var options = NIRA.getOptions("sprint/" + sprintId + "/edit/model", "/rest/greenhopper/1.0/");
        NIRA.GET(options, function(data, statusCode){
            try {
                sprint = data.sprint;
            } catch (e){
                sprint = undefined;
            }
            cb && cb(sprint)
        });
    };

    NIRA.listSprints = function(projectKey, boardName, cb){
        var sprints = [];
        NIRA.getRapidViewId(projectKey, boardName, function(rapidViewId){
            var options = NIRA.getOptions("sprintquery/" + rapidViewId, "/rest/greenhopper/1.0/");
            NIRA.GET(options, function(data, statusCode){
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

    NIRA.getRapidViewId = function(projectKey, boardName, cb){
        var rapidViewId = undefined;
        NIRA.listRapidViews(function(data, statusCode){
            var projectKey = NIRA.nettings.projectKey;
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

    NIRA.listRapidViews = function(cb){
        var options = NIRA.getOptions("rapidviews/list", "/rest/greenhopper/1.0/");
        NIRA.GET(options, function(data, statusCode){
            cb && cb(data, statusCode);
        });
    };

    NIRA.GET = function(options, cb) {
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

    NIRA.POST = function(options, postData, cb) {
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

    NIRA.getDescription = function(issueID, data, cb) {
        NIRA.getIssue(issueID, function(data){
            try {
                var F = data.fields;
                cb && cb(F);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };

    NIRA.getComments = function(issueID, data, cb) {
        NIRA.getIssue(issueID, function(data){
            try {
                cb && cb(data.fields.comment);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };

    NIRA.createComment = function(issueID, comment, cb){
        comment = {
            body : comment
        };
        var options = NIRA.getOptions('issue/' + issueID + '/comment');
        NIRA.POST(options, comment, function(data){
            cb && cb();
        });
    };

    NIRA.ticketIDFromBranch = function(b){
        return b.replace(NIRA.nettings.featurePrefix, NIRA.nettings.jiraPrefix).trim();
    };

    NIRA.clearCache = function(issueID){
        NIRA.issueCacher.clearCache(issueID);
    };

    return NIRA;
}
