module.exports = function() {
    STATUSWATCHER = {};
    STATUSWATCHER.lastPrintTime = 0;
    STATUSWATCHER.minStatusPeriod = 1200;
    STATUSWATCHER.statusDelay = 700;
    STATUSWATCHER.redoStatusTime = STATUSWATCHER.minStatusPeriod + 10 + STATUSWATCHER.statusDelay;

    STATUSWATCHER.reset = function(){
        STATUSWATCHER.lastPrintTime = STATUSWATCHER.now();
    };

    STATUSWATCHER.canPrintStatus = function(){
        return (STATUSWATCHER.now() - STATUSWATCHER.lastPrintTime) > STATUSWATCHER.minStatusPeriod;
    };

    STATUSWATCHER.now = function(){
        return (new Date().getTime());
    };

    return STATUSWATCHER;
}