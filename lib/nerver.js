module.exports = function Nerver(nira) {
    if(!(this instanceof Nerver)) {
        return new Nerver(nira);
    }
    this.nira = nira;
    this.period = 500;
    this.timeoutSpan = (24 * 60 * 60000);//24 hours
    this.hasInitialized = false;
    this.progressSize = Math.floor(15000/this.period);
    this.printer = new require(__dirname + '/printer.js')();

    this.init = function(nit) {
        this.nit = nit;
    };

    this.prompt = function(cb) {
        var self = this;
        var prompt = require('prompt');

        var properties = [
        {
            name: 'username'
        },
        {
            name: 'password',
            hidden: true
        }
        ];

        prompt.start();

        prompt.get(properties, function (err, result) {
            if (err) { return onErr(err); }
            self.nira.login(result.username, result.password, function(isLoggedIn){
                cb && cb(isLoggedIn);
            });
        });

        function onErr(err) {
            self.consoleLog(err);
            return 1;
        }
    };


    this.start = function(arg) {
        var self = this;
        if(arg === "x" || arg === "-x" || arg === "silent"){
            self.silent = true;
        }
        this.prompt(function(isLoggedIn) {
            self.listen(isLoggedIn);
        });
    };

    this.listen = function(isLoggedIn){
        var self = this;
        self.isLoggedIn = isLoggedIn;
        self.onStart();
        self.counter = 0;
        self.startTime = (new Date().getTime());
        require(__dirname+"/../web/server.js")(self);
        self.runInterval = setInterval(function() {

            if(self.shouldEnd()){
                clearInterval(this.runInterval);
                self.consoleLog("Nerver session ended.");
                process.exit();
                return;
            }

            self.counter++;
            self.writeProgress();
        }, self.period);
    };

    this.shouldEnd = function(){
        return (new Date().getTime() - this.startTime) > this.timeoutSpan;
    };
    this.writeProgress = function() {
        if(this.hasInitialized && !this.silent){
            if(this.counter % this.progressSize === 0){
                this.initWriteProgress();
            }
        }
    };

    this.initWriteProgress = function(){
        if(!this.silent) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
    };

    this.onStart = function(){
        var self = this;
        self.clearScreen();
        self.printer.hr2();
        self.consoleLog("\n\n");
        if(!self.isLoggedIn){
            self.consoleLog("Not Logged in");
        } else {
            self.consoleLog("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            self.consoleLog("!!!!!!!!!!Logged in!!!!!!!!!!");
            self.consoleLog("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
        self.consoleLog("Nerver is listening...\n\n\n");
        self.printer.hr2();
        setTimeout(function(){self.hasInitialized = true; self.initWriteProgress(); }, 1550);
    };

    this.write = function(str) {
        if(!this.silent) {
            process.stdout.write(str);
        }
    };

    this.consoleLog = function(str) {
        if(!this.silent) {
            this.printer.print(str);
        }
    }

    this.clearScreen = function(){
        var numLines = process.stdout.getWindowSize()[1];
        this.cursorUp(numLines, false);
    };

    this.cursorUp = function up (i, save) {
        i = i || 1;
        if (i > 0) {
            while(i--) {
                process.stdout.write(!save ? '\033[K\033[1A\r' : '\033[1A\r');
            }
        }
        process.stdout.cursorTo(0);
    };
}