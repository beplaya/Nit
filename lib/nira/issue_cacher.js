module.exports = function Nerver(nira) {
    var ISSUE_CACHER = {};
    ISSUE_CACHER.cachedIssues = [];
    ISSUE_CACHER.expirationPeriod = 30 * 60000;//30 minutes
    // cachedIssue: { id: "", timeCached : 0, issueData : {}}
    ISSUE_CACHER.clearCache = function(issueID){
        if(!issueID)
            return;
        console.log("clearing cache for issue ", issueID);

        var newList = [];
        for(var i=0; i<ISSUE_CACHER.cachedIssues.length; i++) {
            var cachedIssue = ISSUE_CACHER.cachedIssues[i];
            if(issueID !== cachedIssue.id){
                newList.push(cachedIssue);
            }
        }
        ISSUE_CACHER.cachedIssues = newList;
    };

    ISSUE_CACHER.getCachedIssue = function(issueID) {
        var issueData = undefined;
        var now = (new Date().getTime());
        for(var i=0; i<ISSUE_CACHER.cachedIssues.length; i++) {
            var cachedIssue = ISSUE_CACHER.cachedIssues[i];
            if(issueID === cachedIssue.id){
                if(!ISSUE_CACHER.isExpired(cachedIssue)){
                    issueData = JSON.parse(JSON.stringify(cachedIssue.issueData));
                    issueData.fields.cachedAge = Math.floor((now - cachedIssue.timeCached) / 1000);
                    issueData.fields.summary = issueData.fields.summary;
                }
                break;
            }
        }
        return issueData;
    };


    ISSUE_CACHER.cacheIssue = function(issueID, issueData) {
        var found = false;
        var now = (new Date().getTime());
        for(var i = 0; i<ISSUE_CACHER.cachedIssues.length; i++) {
            var CI = ISSUE_CACHER.cachedIssues[i];
            if(issueID === CI.id){
                ISSUE_CACHER.cachedIssues[i].id = issueID;
                ISSUE_CACHER.cachedIssues[i].issueData = issueData;
                ISSUE_CACHER.cachedIssues[i].timeCached = now;
                found = true;
                break;
            }
        }
        if(!found){
            ISSUE_CACHER.cachedIssues.push({
                                           id : issueID,
                                           issueData : issueData,
                                           timeCached : now
                                       });
        }
    };

    ISSUE_CACHER.isExpired = function(cachedIssue) {
        return ((new Date().getTime()) - cachedIssue.timeCached) > ISSUE_CACHER.expirationPeriod;
    };


    return ISSUE_CACHER;
};