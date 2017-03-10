module.exports = function StatusWatcher() {
    if(!(this instanceof StatusWatcher) {
        return new StatusWatcher();
    }
    this.lastPrintTime = 0;
    this.minStatusPeriod = 1200;
    this.statusDelay = 700;
    this.redoStatusTime = this.minStatusPeriod + 10 + this.statusDelay;

    this.reset = function(){
        this.lastPrintTime = this.now();
    };

    this.canPrintStatus = function(){
        return (this.now() - this.lastPrintTime) > this.minStatusPeriod;
    };

    this.now = function(){
        return (new Date().getTime());
    };

}