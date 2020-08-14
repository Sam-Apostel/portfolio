var game = {
    display: {
        FPV: document.createElement("canvas"),
        HID: document.createElement("div"),
        DEBUG: document.createElement("canvas"),
        CTX:  undefined,
        lastFps:0,
        debugctx: undefined,
        plotFPS: function(fps){
            var mappedFps = fps.map(0, 70, 99,0) >>> 0;
            var imageData = this.debugctx.getImageData(1, 0, 90, 100);
            this.debugctx.canvas.width = this.debugctx.canvas.width;
            this.debugctx.putImageData(imageData, 0, 0);
            this.debugctx.beginPath();
            this.debugctx.moveTo(89,this.lastFps);
            this.debugctx.lineTo(90,mappedFps);
            this.debugctx.stroke();
            this.debugctx.fillText(fps >> 0, 91,20);
            this.lastFps = mappedFps;
        },
        map: {
            width: 10,
            height: 10
        },
        fpv: {
            width: window.innerWidth,
            height: window.innerHeight,
            imgData: undefined,
            bufLength: undefined
        },
        hid: undefined
    },
    first: true,
    setup: function () {
        this.display.FPV.id = "fpv";
        this.display.FPV.width = this.display.fpv.width;
        this.display.FPV.height = this.display.fpv.height;
        this.display.HID.id = "hid";
        this.display.DEBUG.id = "debug";
        this.display.DEBUG.width = 100;
        this.display.DEBUG.height = 100;
        this.display.debugctx = this.display.DEBUG.getContext("2d");
        document.body.appendChild(this.display.FPV);
        document.body.appendChild(this.display.DEBUG);
        this.display.CTX = this.display.FPV.getContext("2d");
        this.display.fpv.imgData = this.display.CTX.getImageData(0,0,this.display.fpv.width, this.display.fpv.height);
        this.display.fpv.bufLength = new ArrayBuffer(this.display.fpv.imgData.data.length);

        document.body.appendChild(this.display.HID);
        window.addEventListener("keydown", this.player.keydown, false);
        window.addEventListener("keyup", this.player.keyup, false);
        this.player.fov = this.display.fpv.width / this.display.fpv.height / .8;
        this.setupSprite();
        this.start();
    },
    sprite: undefined,
    setupSprite: function(){
        var canvas = document.createElement('canvas');
        this.sprite = canvas.getContext('2d');
        var img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            this.sprite.drawImage(img, 0, 0);

            for(var x = 0; x < 8; x++){
                var col = [];
                for(var y = 0; y < 8; y++){
                    var pixels = [];
                    for(var u = 0; u < 8; u++){
                        var COL = [];
                        for(var v = 0; v < 8; v++){
                            COL.push(this.sprite.getImageData(x * 8 + u, y * 8 + v, 1, 1).data);
                        }
                        pixels.push(COL);
                    }
                    col.push(pixels);
                }
                this.graphicsFn.spriteData.push(col);
            }
        };
        img.src = "assets/sprite.png";
    },
    player: {
        position: {x:2,y:2},
        rotation: 1,
        speed: .001,
        fov: 20,
        renderdistance: 10,
        pressedKeys: [],
        keyMap: {
            39: 'right', 37: 'left', 38: 'up', 40: 'down', 81: 'q', 68: 'd', 65: 'a', 90: 'z', 69: 'e', 83: 's',
        },
        moved: true,
        rotate: function(angle){
            this.rotation += angle;
            this.moved = true;
        },
        walk: function(distance, strafe){
            var angle = strafe ?  Math.PI / 2 : 0;
            var translation = {x:Math.sin(this.rotation + angle) * distance,y:Math.cos(this.rotation + angle) * distance};
            this.position.x += translation.x;
            this.position.y +=  translation.y;
            if(game.arena[this.position.y >> 0].charAt(this.position.x >> 0) != '.'){
                this.position.x -= translation.x;
                this.position.y -=  translation.y;
            }else{
                this.moved = true;
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
            if(!game.first) {
               this.moved = false;
            }
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
            return this.moved;
        }
    },
    arena: [
        "##########",
        "#........#",
        "#........#",
        "#...g....#",
        "#...c....#",
        "#........#",
        "#........#",
        "#..####.##",
        "#........#",
        "##########"
    ],
    lastRender: 0,
    loop: function (timestamp) {
        var progress = timestamp - game.lastRender;

        var moved = game.player.move(progress);
        game.first = false;
        if(moved) {
            var buf = game.display.fpv.bufLength;
            var buf8 = new Uint8ClampedArray(buf);
            var data = new Uint32Array(buf);
            data.fill(0);

            game.graphicsFn.scanLines(game.player, game.display.fpv, game.display.map, game.arena, data);

            game.display.fpv.imgData.data.set(buf8);
            game.display.CTX.putImageData(game.display.fpv.imgData, 0, 0);

        }
        game.display.plotFPS(1/ (progress / 1000));
        game.lastRender = timestamp;

        if(game.active) {
            window.requestAnimationFrame(game.loop);
        }
    },
    graphicsFn:{
        scanLines: function(player, fpv, map, arena, data){
            for (var x = 0; x < fpv.width; x++) {
                game.graphicsFn.scanLine(player,fpv,map,arena, x, data);
            }
        },
        scanLine: function(player, fpv, map, arena, col, data){
            var rayA = (player.rotation - (player.fov / 2)) + (col / fpv.width) * player.fov;
            var distToWall = 0;
            var hitWall = false;
            var hitBoundary = false;
            var eye = {x:Math.sin(rayA),y:Math.cos(rayA)};
            var samplePoint = {x:0,y:0};
            var texel = {x:0,y:0,o:0};
            while (!hitWall && distToWall < player.renderdistance) {
                distToWall += .02;
                var testPos = {x:player.position.x + eye.x * distToWall >> 0,y:player.position.y + eye.y * distToWall >> 0};
                if (testPos.x < 0 || testPos.x >= map.width || testPos.y < 0 || testPos.y >= map.height) {
                    distToWall = player.renderdistance;
                } else if (arena[testPos.y].charAt(testPos.x) != ".") {
                    hitWall = true;
                    //hitBoundary = game.graphicsFn.hitEdge(.002, player.position, testPos, eye, distToWall);
                    var texture = arena[testPos.y].charAt(testPos.x);
                    if(texture === "c"){
                        texel = {x:1,y:2,o:0};
                    }else if(texture === "g"){
                        texel = {x:2,y:0,o:0};
                    }else if(texture === "o"){
                        texel = {x:1,y:1,o:0};
                    }else if(texture === "t"){
                        texel = {x:4,y:0,o:0};
                    }else if(texture === "T"){
                        texel = {x:5,y:0,o:0};
                    }else if(texture === "#"){
                        texel = {x:3,y:0,o:.5};
                    }
                    samplePoint.x = game.graphicsFn.getWallSamplepoint(testPos, player.position, eye, distToWall, texel.o);
                }
            }
            var ceiling = (fpv.height / 2) - (fpv.height / distToWall / 3) >> 0;
            var texelOffset = ceiling<0?Math.abs(ceiling):0;
            ceiling=ceiling<0?0:ceiling;
            var floor = fpv.height - ceiling;

            var shading = game.graphicsFn.dToShade(hitBoundary ? player.renderdistance : distToWall, player.renderdistance);
            for(var y = ceiling; y < floor; y++){
                samplePoint.y = ((y) - (ceiling - texelOffset)) /  ((floor + texelOffset) - (ceiling-texelOffset));
                data[y * fpv.width + col] = game.graphicsFn.sampleColour(texel, {x:(samplePoint.x%1)*8>>0,y:(samplePoint.y%1)*8>>0}, shading);
            }
        },
        hitEdge: function(edgeAngle, playerPos, wallPos, eyePos, wallD){

            for(var tx = 0; tx < 2; tx++){
                for(var ty = 0; ty < 2; ty++) {
                    var vx = wallPos.x + tx - playerPos.x;
                    var vy = wallPos.y + ty - playerPos.y;
                    var d = Math.sqrt(vy * vy + vx * vx);
                    var dot = Math.acos((eyePos.x * vx / d) + (eyePos.y * vy / d));
                    if(d < wallD && dot < edgeAngle)return true;
                }
            }
            return false
        },
        getWallSamplepoint: function(wallPoss, playerPoss, eyePos, wallD, offset){
            var sampleX = 0;
            var blockCenter = {x:wallPoss.x + .5,y:wallPoss.y + .5};
            var collisionLoc = {x:playerPoss.x + eyePos.x * wallD,y:playerPoss.y + eyePos.y * wallD};
            var blockAngle = Math.atan2(collisionLoc.y - blockCenter.y, collisionLoc.x - blockCenter.x);
            if(blockAngle >= (- Math.PI) * .25 && blockAngle < Math.PI * .25)
                sampleX = collisionLoc.y - wallPoss.y + offset;
            if(blockAngle >= Math.PI * .25 && blockAngle < Math.PI * .75)
                sampleX = collisionLoc.x - wallPoss.x;
            if(blockAngle < (- Math.PI) * .25 && blockAngle >= (- Math.PI) * .75)
                sampleX = collisionLoc.x - wallPoss.x;
            if(blockAngle >= Math.PI * .75 || blockAngle < (- Math.PI) * .75)
                sampleX = collisionLoc.y - wallPoss.y + offset;
            return sampleX;

        },
        spriteData:[],
        color: new Uint32Array(1),
        sampleColour: function (spriteCoord, samplePoint, shade){
            var shaded = new Uint8ClampedArray(1);
            var pixel = this.spriteData[spriteCoord.x][spriteCoord.y][samplePoint.x][samplePoint.y];
            this.color[0] = 255 << 24;
            for(var i = 0; i < 3; i++){
                shaded[0] = shade.map(255,0,0,pixel[i]);
                this.color[0] |= shaded[0] << (i*8);
            }
            return this.color[0];
        },
        dToShade: function (distance, renderD){
            return distance.map(0,renderD,0,255) >>> 0;
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
/*Number.prototype.map=function(lowIn, highIn, lowOut, highOut) {
    return lowOut + (highOut - lowOut) * (this - lowIn) / (highIn - lowIn);
};*/
Number.prototype.map=function(a,b,c,d){return a+(d-c)*(this-a)/(b-a)};
const clamp=(...v)=>v.sort((a,b)=>a-b)[1];


game.setup();





