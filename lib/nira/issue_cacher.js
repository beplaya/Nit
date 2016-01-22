module.exports = function Nerver(nira) {
    var ISSUE_CACHER = {};
    ISSUE_CACHER.cachedIssues = [];
    ISSUE_CACHER.expirationPeriod = 60 * 60000;//1 hour
    // cachedIssue: { id: "", timeCached : 0, issueData : {}}


    ISSUE_CACHER.getCachedIssue = function(issueID) {
        var issueData;
        for(var i; i<ISSUE_CACHER.cachedIssues.length; i++) {
            var cachedIssue = ISSUE_CACHER.cachedIssues[i].cachedIssue;
            if(issueID === cachedIssue.id){
                if(!isExpired(cachedIssue)){
                    issueData = ISSUE_CACHER[i].issueData;
                }
                break;
            }
        }
        return undefined;
    };


    ISSUE_CACHER.cacheIssue = function(issueID, issueData) {
        for(var i; i<ISSUE_CACHER.cachedIssues.length; i++) {
            var cachedIssue = ISSUE_CACHER.cachedIssues[i].cachedIssue;
            if(issueID === cachedIssue.id){
                ISSUE_CACHER.cachedIssues[i].issueData = issueData;
                var summary = "CACHED\n" + ISSUE_CACHER.cachedIssues[i].issueData.fields.summary;
                ISSUE_CACHER.cachedIssues[i].issueData.fields.summary = summary;
                ISSUE_CACHER.cachedIssues[i].timeCached = (new Date().getTime());
                return;
            }
        }
        console.log(ISSUE_CACHER.cachedIssues.length, "cached issues");
    };

    ISSUE_CACHER.isExpired = function(cachedIssue) {
        return ((new Date().getTime()) - cachedIssue.timeCached) > ISSUE_CACHER.expirationPeriod;
    };


    return ISSUE_CACHER;
};