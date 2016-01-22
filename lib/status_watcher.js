module.exports = function() {
    STATUSWATCHER = {};
    STATUSWATCHER.lastPrintTime = 0;
    STATUSWATCHER.minStatusPeriod = 3000;

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