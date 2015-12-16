

var value = 10000000;

var delta = 500;
var msg = "";
for(var i=0; i<30; i++){
	var r = Math.random();
	if(r>.7){
		value += delta;	
	}else if(r>.5){
		value -= delta;
	}else if(r<.1){
		value += Math.random() * delta;
	}
	msg += " " + value;
}
console.log(msg);
