var game = {
    display: {
        MAP: document.createElement("canvas"),
        FPV: document.createElement("div"),
        HID: document.createElement("div"),
        draw: function (map, fpv) {
            this.MAP.innerHTML = map.join("\n");
            this.FPV.innerHTML = fpv.join("\n");
        },
        plotPlayer: function(){
            tempArena = game.arena.slice();
            tempArena[Math.floor(game.player.position.y)] = tempArena[Math.floor(game.player.position.y)].replaceAt(Math.floor(game.player.position.x), "•");
            return tempArena;
        },
        map: {
            width: 10,
            height: 10
        },
        fpv: {
            width: 256,
            height: 128
        },
        hid: undefined
    },
    setup: function () {
        this.display.MAP.id = "map";
        this.display.FPV.id = "fpv";
        this.display.HID.id = "hid";
        document.body.appendChild(this.display.FPV);
        document.body.appendChild(this.display.HID);
        document.body.appendChild(this.display.MAP);
        var start = document.createElement("button");
        start.innerHTML = "|| >";
        document.body.appendChild(start);
        start.setAttribute('onclick', "game.toggle();");
        window.addEventListener("keydown", this.player.keydown, false);
        window.addEventListener("keyup", this.player.keyup, false);
        this.start();
    },
    player: {
        position: {
            x: 7.5,
            y: 2.75,
            r: 5.2
        },
        speed: .001,
        fov: Math.PI / 3,
        renderdistance: 10,
        pressedKeys: [],
        keyMap: {
            39: 'right', 37: 'left', 38: 'up', 40: 'down', 81: 'q', 68: 'd'
        },
        rotate: function(angle){
            this.position.r += angle;
            if(this.position.r > Math.PI * 2){
                this.position.r -= Math.PI * 2;
            }else if(this.position.r < 0){
                this.position.r += Math.PI * 2;
            }
        },
        walk: function(distance){
            this.position.x += Math.sin(this.position.r) * distance;
            this.position.y += Math.cos(this.position.r) * distance;
            if(game.arena[Math.floor(this.position.y)].charAt(Math.floor(this.position.x)) === '#'){
                this.position.x -= Math.sin(this.position.r) * distance;
                this.position.y -= Math.cos(this.position.r) * distance;
            }
        },
        strafe: function (distance) {
            this.position.x += Math.sin(this.position.r + Math.PI / 2) * distance;
            this.position.y += Math.cos(this.position.r + Math.PI / 2) * distance;
            if(game.arena[Math.floor(this.position.y)].charAt(Math.floor(this.position.x)) === '#'){
                this.position.x -= Math.sin(this.position.r + Math.PI / 2) * distance;
                this.position.y -= Math.cos(this.position.r + Math.PI / 2) * distance;
            }
        },
        keydown: function(event){
            var key = game.player.keyMap[event.keyCode];
            game.player.pressedKeys[key] = true;
        },
        keyup: function(event){
            var key = game.player.keyMap[event.keyCode];
            game.player.pressedKeys[key] = false;
        },
        move: function (time) {
            if(this.pressedKeys['q']){
                this.rotate(- this.speed * time);
            }
            if(this.pressedKeys['d']){
                this.rotate(this.speed * time);
            }
            if(this.pressedKeys['up']){
                this.walk(this.speed * time * 2);
            }
            if(this.pressedKeys['down']){
                this.walk(- this.speed * time * 2);
            }
            if(this.pressedKeys['left']){
                this.strafe(- this.speed * time);
            }
            if(this.pressedKeys['right']){
                this.strafe(this.speed * time);
            }
        }
    },
    arena: [
        "##########",
        "#........#",
        "#........#",
        "#........#",
        "#...#....#",
        "#...#....#",
        "#........#",
        "#..####.##",
        "#........#",
        "##########"
    ],
    fpv: [],
    lastRender: 0,
    loop: function (timestamp) {
        var progress = timestamp - game.lastRender;
        game.player.move(progress);
        game.fpv = [];
        for (var x = 0; x < game.display.fpv.width; x++) {
            var rayA = (game.player.position.r - (game.player.fov / 2)) + (x / game.display.fpv.width) * game.player.fov;
            var distToWall = 0;
            var hitWall = false;
            var hitBoundary = false;
            var eyeX = Math.sin(rayA);
            var eyeY = Math.cos(rayA);
            while (!hitWall && distToWall < game.player.renderdistance) {
                distToWall += .01;
                var testX = Math.floor(game.player.position.x + eyeX * distToWall);
                var testY = Math.floor(game.player.position.y + eyeY * distToWall);
                if (testX < 0 || testX >= game.display.map.width || testY < 0 || testY >= game.display.map.height) {
                    distToWall = game.player.renderdistance;
                } else if (game.arena[testY].charAt(testX) === "#") {
                    hitWall = true;
                    var edgeAngle = .0025;
                    for(var tx = 0; tx < 2; tx++){
                        for(var ty = 0; ty < 2; ty++){
                            var vy = testY + ty - game.player.position.y;
                            var vx = testX + tx - game.player.position.x;
                            var d = Math.sqrt(vy * vy + vx * vx);
                            var dot = Math.acos(( eyeX * vx / d ) + (eyeY * vy / d));
                            if(d < distToWall && dot < edgeAngle){
                                hitBoundary = true;
                            }
                        }
                    }
                }
            }
            var ceiling = (game.display.fpv.height / 2) - (game.display.fpv.height / distToWall / 1.5);
            var floor = game.display.fpv.height - ceiling;

            var shadeW = "#";
            if (distToWall <= game.player.renderdistance / 4)       shadeW = "X";
            else if (distToWall < game.player.renderdistance / 3)   shadeW = "+";
            else if (distToWall < game.player.renderdistance / 2)   shadeW = "-";
            else if (distToWall < game.player.renderdistance)       shadeW = ".";
            else                                                    shadeW = "&nbsp;";
            if(hitBoundary)                                         shadeW = "&nbsp;";
            for (var y = 0; y < game.display.fpv.height; y++) {
                if (y < ceiling || y >= floor) {
                    game.fpv[y] = (game.fpv[y] || "") + "&nbsp;";
                }else if (y < floor){
                    game.fpv[y] = (game.fpv[y] || "") + shadeW;
                }
            }

        }
        game.display.draw(game.display.plotPlayer(), game.fpv);
        game.lastRender = timestamp;
        if(game.active) {
            window.requestAnimationFrame(game.loop);
        }
    },
    active: false,
    stop: function () {
        this.active = false;
    },
    start: function () {
        this.active = true;
        window.requestAnimationFrame(this.loop);
    },
    toggle: function(){
        if(this.active){
            this.stop();
        }else{
            this.start();
        }
    }
};
String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}
game.setup();
function wait(ms) {
    const start = performance.now();
    while(performance.now() - start < ms);
}