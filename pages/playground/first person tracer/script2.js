var game = {
    display: {
        FPV: document.createElement("canvas"),
        HID: document.createElement("div"),
        DEBUG: document.createElement("canvas"),
        CTX:  undefined,
        draw: function (fpv) {
            this.CTX.canvas.width = this.CTX.canvas.width;
            fpv.forEach(function(col, i){
                var ctx = game.display.CTX;
                ctx.strokeStyle = col.color;
                ctx.beginPath();
                ctx.moveTo(i, col.top >> 0);
                ctx.lineTo(i, col.bottom >> 0);
                ctx.stroke();

                /*for(var row = 0; row < col.color.length;row++){
                    ctx.strokeStyle = "rgb("+col.color[row].r+","+col.color[row].g+","+col.color[row].b+")";
                    ctx.beginPath();
                    ctx.moveTo(i, (col.top >> 0) + row);
                    ctx.lineTo(i, (col.top >> 0)+ row + 1 );
                    ctx.stroke();
                }*/


            });
        },
        plotFPS: function(fps){
            var ctx = this.DEBUG.getContext("2d");
            var imageData = ctx.getImageData(1, 0, 99, 100);
            ctx.canvas.width = ctx.canvas.width;
            ctx.putImageData(imageData, 0, 0);
            ctx.fillStyle = "white";
            ctx.fillRect( 98,mapV(fps, 40, 70, 99,0) >>> 0, 100, 1);
        },
        map: {
            width: 10,
            height: 10
        },
        fpv: {
            width: window.innerWidth,
            height:window.innerHeight
        },
        hid: undefined
    },
    setup: function () {
        this.display.FPV.id = "fpv";
        this.display.FPV.width = this.display.fpv.width;
        this.display.FPV.height = this.display.fpv.height;
        this.display.HID.id = "hid";
        this.display.DEBUG.id = "debug";
        this.display.DEBUG.width = 100;
        this.display.DEBUG.height = 100;
        document.body.appendChild(this.display.FPV);
        document.body.appendChild(this.display.DEBUG);
        this.display.CTX = this.display.FPV.getContext("2d");
        document.body.appendChild(this.display.HID);
        window.addEventListener("keydown", this.player.keydown, false);
        window.addEventListener("keyup", this.player.keyup, false);
        this.player.fov = this.display.fpv.width / this.display.fpv.height / 1.6;
        this.setupSprite();
        this.start();
    },
    sprite: undefined,
    setupSprite: function(){
        var canvas = document.createElement('canvas');
        this.sprite = canvas.getContext('2d');
        var img = new Image();
        img.onload = a => {
            canvas.width = img.width;
            canvas.height = img.height;
            this.sprite.drawImage(img, 0, 0);
        };
        img.src = "assets/sprite.png";

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
            39: 'right', 37: 'left', 38: 'up', 40: 'down', 81: 'q', 68: 'd', 65: 'a', 90: 'z', 69: 'e', 83: 's',
        },
        rotate: function(angle){
            this.position.r += angle;
        },
        walk: function(distance, strafe){
            var angle = strafe ?  Math.PI / 2 : 0;
            this.position.x += Math.sin(this.position.r + angle) * distance;
            this.position.y += Math.cos(this.position.r + angle) * distance;
            if(game.arena[this.position.y >>> 0].charAt(this.position.x >>> 0) === '#'){
                this.position.x -= Math.sin(this.position.r + angle) * distance;
                this.position.y -= Math.cos(this.position.r + angle) * distance;
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
            if(this.pressedKeys['a']){
                this.rotate(- this.speed * time);
            }
            if(this.pressedKeys['e']){
                this.rotate(this.speed * time);
            }
            if(this.pressedKeys['z']){
                this.walk(this.speed * time * 2, false);
            }
            if(this.pressedKeys['s']){
                this.walk(- this.speed * time * 2, false);
            }
            if(this.pressedKeys['q']){
                this.walk(- this.speed * time, true);
            }
            if(this.pressedKeys['d']){
                this.walk(this.speed * time, true);
            }
        }
    },
    arena: [
        "##########",
        "#........#",
        "#........#",
        "#...#....#",
        "#...#....#",
        "#........#",
        "#........#",
        "#..####.##",
        "#........#",
        "##########"
    ],
    lastRender: 0,
    loop: function (timestamp) {
        var progress = timestamp - game.lastRender;

        game.player.move(progress);

        var screenBuffer = game.graphicsFn.scanLines(game.player,game.display.fpv,game.display.map,game.arena);

        game.display.draw(screenBuffer);
        game.display.plotFPS(1/ (progress / 1000));

        game.lastRender = timestamp;
        if(game.active) {
            window.requestAnimationFrame(game.loop);
        }
    },
    graphicsFn:{
        scanLines: function(player, fpv, map, arena){
            var lines = [];
            for (var x = 0; x < fpv.width; x++) {
                lines.push(game.graphicsFn.scanLine(game.player,game.display.fpv,game.display.map,game.arena, x));
            }
            return lines;
        },
        scanLine: function(player, fpv, map, arena, col){
            var rayA = (player.position.r - (player.fov / 2)) + (col / fpv.width) * player.fov;
            var distToWall = 0;
            var hitWall = false;
            var hitBoundary = false;
            var eyeX = Math.sin(rayA);
            var eyeY = Math.cos(rayA);
            var sampleX = 0;
            while (!hitWall && distToWall < player.renderdistance) {
                distToWall += .05;
                var testX = (player.position.x + eyeX * distToWall) >>> 0;
                var testY = (player.position.y + eyeY * distToWall) >>> 0;
                if (testX < 0 || testX >= map.width || testY < 0 || testY >= map.height) {
                    distToWall = player.renderdistance;
                } else if (arena[testY].charAt(testX) === "#") {
                    hitWall = true;
                    hitBoundary = game.graphicsFn.hitEdge(.002, player.position, {x:testX, y:testY}, {x:eyeX, y:eyeY}, distToWall);
                    sampleX = game.graphicsFn.getWallSamplepoint({x:testX, y:testY}, player.position, {x:eyeX, y:eyeY}, distToWall);
                }
            }
            var ceiling = (fpv.height / 2) - (fpv.height / distToWall / 1.5);
            var floor = fpv.height - ceiling;
            var shading = dToHex(hitBoundary ? player.renderdistance : distToWall);
            var color = [];
            /*for(var y = ceiling; y < floor; y++){
                var sampleY = (y - ceiling) /  (floor - ceiling);
                color.push(game.graphicsFn.sampleColour({x:3,y:0}, {x: sampleX,y: sampleY}, game.sprite));
            }*/
            return {top: ceiling, bottom: floor, color: shading};
        },
        hitEdge: function(edgeAngle, playerPos, wallPos, eyePos, wallD){
            for(var tx = 0; tx < 2; tx++){
                for(var ty = 0; ty < 2; ty++) {
                    var vy = wallPos.y + ty - playerPos.y;
                    var vx = wallPos.x + tx - playerPos.x;
                    var d = Math.sqrt(vy * vy + vx * vx);
                    var dot = Math.acos((eyePos.x * vx / d) + (eyePos.y * vy / d));
                    if(d < wallD && dot < edgeAngle)return true;
                }
            }
            return false
        },
        getWallSamplepoint: function(wallPoss, playerPoss, eyePos, wallD){
            var sampleX = 0;
            var blockCenter = {x:wallPoss.x + .5, y:wallPoss.y + .5};
            var collisionLoc = {x:playerPoss.x + eyePos.x * wallD, y:playerPoss.y + eyePos.y * wallD};
            var blockAngle = Math.atan2(collisionLoc.y - blockCenter.y, collisionLoc.x - blockCenter.x);
            if(blockAngle >= (- Math.PI) * .25 && blockAngle < Math.PI * .25)
                sampleX = collisionLoc.y - wallPoss.y;
            if(blockAngle >= Math.PI * .25 && blockAngle < Math.PI * .75)
                sampleX = collisionLoc.x - wallPoss.x;
            if(blockAngle < (- Math.PI) * .25 && blockAngle >= (- Math.PI) * .75)
                sampleX = collisionLoc.x - wallPoss.x;
            if(blockAngle >= Math.PI * .75 || blockAngle < (- Math.PI) * .75)
                sampleX = collisionLoc.y - wallPoss.y;
            return sampleX;

        },
        sampleColour: function (spriteCoord, samplePoint, sprite){// sprite has an x and a y (0 - 7), sample has a x and a y (0 - 1)
            var x = ((spriteCoord.x + (samplePoint.x % 1)) * 8 >>> 0);
            var y = ((spriteCoord.y + (samplePoint.y % 1)) * 8 >>> 0);
            var pixel = sprite.getImageData(x, y, 1, 1).data;
            return {r: pixel[0], g: pixel[1],  b: pixel[2]};
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
function mapV(value, lowIn, highIn, lowOut, highOut) {
    return lowOut + (highOut - lowOut) * (value - lowIn) / (highIn - lowIn);
}
function dToHex(distance){
    var bright = (mapV(distance,0,10,255,0) >>> 0).toString(16);
    if (bright.length % 2) {
        bright = '0' + bright;
    }
    return '#'+bright+bright+bright;
}


game.setup();






