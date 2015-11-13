module.exports = function Nira(nettings) {
    var NIRA = {};
    NIRA.nettings = nettings;
    NIRA.baseURL = "https://" + NIRA.nettings.jira.host + "/browse/";


    NIRA.login = function(username, password, cb) {
        var self = NIRA;
        self.basicAuth = new Buffer(username + ":" + password).toString('base64');
        cb && cb();
    };

    NIRA.getOptions = function(path){
         return {
                    host: NIRA.nettings.jira.host,
                    port: 443,
                    method: 'GET',
                    path : "/rest/api/2/"+path,
                    headers: { "Content-Type": "application/json", "Authorization": "Basic "+NIRA.basicAuth }
                };
    };

    NIRA.getIssue = function(issueID, cb) {
        var self = NIRA;
        var options = self.getOptions('issue/' + issueID);
        self.GET(options, cb);
    };

    NIRA.GET = function(options, cb) {
        var data = "";
        var https = require('https');
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
                cb && cb(data);
            });
        });

        req.end();

        req.on('error', function(e) {
          cb && cb({error:e});
        });
    };

    NIRA.getDescription = function(issueID, cb) {
        NIRA.getIssue(issueID, function(data){
            try {
                var F = data.fields;
                cb && cb(F);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };

    NIRA.getComments = function(issueID, cb) {
        NIRA.getIssue(issueID, function(data){
            try {
                cb && cb(data.fields.comment);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };
    NIRA.ticketIDFromBranch = function(b){
        return b.replace(NIRA.nettings.featurePrefix, NIRA.nettings.jiraPrefix).trim();
    };
    return NIRA;
}
