let boats = [];
let testArea = {
    width : 300,
    height : 300,
    canvas : document.createElement("canvas"),
    start: function(){
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);
        this.interval = setInterval(updateTestArea, 10);
        this.keys = [];
        window.addEventListener('keydown', function (e) {
            e.preventDefault();
            testArea.keys[e.keyCode] = (e.type == "keydown");
        });
        window.addEventListener('keyup', function (e) {
            testArea.keys[e.keyCode] = true;
            testArea.keys[e.keyCode] = (e.type == "keydown");
        });
    },
    stop : function() {
        clearInterval(this.interval);
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};
let wind = {
    direction: 0,
    force: 5,
    render: function(){

    }
};
function Vessel(length, width, color, x, y, angle, main, head, spinnaker) {
    this.size = {length:length, width:width};
    this.color = color;
    this.position = {x:x, y:y, a: angle};
    this.sails = {main:main,head:head, spinnaker:spinnaker};
    this.step = {
        pos: this.position,
        front: function(){
            this.pos.x+= Math.cos(this.pos.a);
            this.pos.y+= Math.sin(this.pos.a);
        },
        left: function(){
            this.pos.a-=.07;
        },
        right: function(){
            this.pos.a+=.07;
        }
    };
    this.update = function(){
        if(testArea.keys && testArea.keys[90]){this.step.front()}
        if(testArea.keys && testArea.keys[81]){this.step.left()}
        if(testArea.keys && testArea.keys[68]){this.step.right()}
        return this;
    };
    this.render = function(wind){
        let widthOffset = 3.14 - this.size.width / this.size.length * 1.5;
        testArea.context.fillStyle = this.color;
        testArea.context.beginPath();
        testArea.context.moveTo(this.position.x + Math.cos(this.position.a) * this.size.length / 2, this.position.y + Math.sin(this.position.a) * this.size.length / 2);
        testArea.context.lineTo(this.position.x + Math.cos(this.position.a - widthOffset) * this.size.length / 2, this.position.y + Math.sin(this.position.a - widthOffset) * this.size.length / 2);
        testArea.context.lineTo(this.position.x + Math.cos(this.position.a + widthOffset) * this.size.length / 2, this.position.y + Math.sin(this.position.a + widthOffset) * this.size.length / 2);
        testArea.context.fill();
        testArea.context.closePath();
        testArea.context.beginPath();
        testArea.context.strokeStyle = "red";
        testArea.context.arc(this.position.x, this.position.y, this.size.length/2 + 3,0, Math.PI * 2, true);
        testArea.context.stroke();
        testArea.context.closePath();

        for(let key in this.sails){
            let sail = this.sails[key];
            if(sail.set) {
                let sailX = this.position.x + Math.cos(this.position.a) * (this.size.length / 2) * sail.pos;
                let sailY = this.position.y + Math.sin(this.position.a) * (this.size.length / 2) * sail.pos;
                sail.render({x:sailX,y:sailY}, wind, this.position.a);
            }
        }
        return this;
    };
}
function Sail(length, angle, pos, set, color){
    this.length = length;
    this.angle = Math.PI - angle;
    this.pos = pos;
    this.set = set;
    this.color = color;
    this.render = function(fix, wind, boatAngle){
        let inc = {x:this.length * Math.cos(this.angle + boatAngle),y:this.length * Math.sin(this.angle + boatAngle)};
        let midpoint = {x: fix.x + inc.x / 2, y: fix.y + inc.y / 2};

        testArea.context.strokeStyle = this.color;

        testArea.context.beginPath();
        testArea.context.moveTo(fix.x, fix.y);
        testArea.context.quadraticCurveTo(midpoint.x, midpoint.y, fix.x + inc.x, fix.y + inc.y);
        testArea.context.stroke();
        testArea.context.closePath();
    };
}

function updateTestArea(){
    testArea.clear();
    boats.forEach(vessel => vessel.update(wind).render());
    wind.render();
}

boats.push( new Vessel(40,20,"darkblue", 150, 150, Math.PI / 4, new Sail(20, .5, 0, true, "yellow"), new Sail(15, .6, .9, true, "yellow"), new Sail(27, 0, 1.2, false, "yellow")));
testArea.start();