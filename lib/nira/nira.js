module.exports = function Nira(nettings) {
    var NIRA = {};
    NIRA.nettings = nettings;
    NIRA.baseURL = "https://" + NIRA.nettings.jira.host + "/browse/";


    NIRA.login = function(username, password, cb) {
        var self = NIRA;
        self.basicAuth = new Buffer(username + ":" + password).toString('base64');
        self.authorize(function(data, statusCode){
            var loggedin = statusCode && statusCode != 404 && statusCode != 401 && statusCode != "401";
            cb && cb(loggedin);
        });
    };

    NIRA.authorize = function(cb){
        var self = NIRA;
        var options = self.getOptions("");
        options.path = "/rest/auth/1/session";
        console.log("Logging into https://" + self.nettings.jira.host);
        self.GET(options, cb);
    };

    NIRA.getOptions = function(path){
         return {
                    host: NIRA.nettings.jira.host,
                    port: 443,
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
        var self = NIRA;
        comment = {
            body : comment
        };
        var options = self.getOptions('issue/' + issueID + '/comment');
        self.POST(options, comment, function(data){
            cb && cb();
        });
    };

    NIRA.ticketIDFromBranch = function(b){
        return b.replace(NIRA.nettings.featurePrefix, NIRA.nettings.jiraPrefix).trim();
    };

    return NIRA;
}
