if (window.File && window.FileReader && window.FileList && window.Blob) {
    function handleFileSelect(evt) {
        let files = evt.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        let output = [];
        for (let i = 0, f; f = files[i]; i++) {
            console.log( escape(f.name), f.type, f.size);
            let reader = new FileReader();

            reader.onload = (function(theFile) {
                return function(e) {
                    // Render thumbnail.
                    console.log(e.target.result);
                };
            })(f);
            reader.addEventListener("loadend", function() {
                const view = new Uint8Array(reader.result);
                console.log(view);
                document.body.innerHTML += view.toString().replace(/,/g, ", ");
                const bin = [...view].map((n) => n.toString(2)).join(' ');
                //document.body.innerHTML += bin;
            });

            reader.readAsArrayBuffer(f);
        }
    }

    document.getElementById('files').addEventListener('change', handleFileSelect, false);
} else {
    alert('The File APIs are not fully supported in this browser.');
}

let timespan = 50 * 60;
let interval = 1;

let map_vars = {min:{x:-400, y:-200},max:{x:400, y:200}, grid_size: 10};
let map = new TimeMap(timespan, interval, map_vars.min.x, map_vars.max.x, map_vars.min.y, map_vars.max.y, map_vars.grid_size);

const canvas = document.createElement("canvas");
let padding = 15;
canvas.width = map_vars.max.x - map_vars.min.x + padding*2;
canvas.height = map_vars.max.y - map_vars.min.y + padding*2;
document.body.appendChild(canvas);

/**
 * @author Sam Apostel / tigrr.be
 * @param angle:    angle in radians, north = 0.
 *                  direction of vector.
 *
 * @param force:    acting force of vector expressed in knots
 *
 * @constructor     only angle and force required. position will be stored in arrayMatrix
 * @returns         this object
 */
function Vec2(angle, force){
    this.a = angle;
    this.f = force;
}
Object.assign(Vec2.prototype,{

});


/**
 * @author Sam Apostel / tigrr.be
 */
function TimeMap(timespan, interval, min_x, max_x, min_y, max_y, resolution){
    this.simplex = [new SimplexNoise(),new SimplexNoise(),new SimplexNoise(),new SimplexNoise()];
    this.map_vars =  {min:{x:min_x, y:min_y},max:{x:max_x, y:max_y}, grid_size: resolution};
    this.timespan = timespan;
    this.interval = interval;
    this.time = [];
    this.getValue = function(type, time, x ,y, scale){
        let sc = [.01,.01,.01];
        return (this.simplex[type].noise3d(time * sc[0], x * sc[1], y * sc[2]) + 1) / 2 * scale;
    };
    for(let now = 0; now < this.timespan;now+= this.interval){
        let map = [];
        for(let x = this.map_vars.min.x; x <= this.map_vars.max.x; x+= this.map_vars.grid_size){
            map.push([]);
            for(let y = this.map_vars.min.y; y <= this.map_vars.max.y; y+= this.map_vars.grid_size){
                let arrayX = (x - this.map_vars.min.x)/this.map_vars.grid_size;
                let arrayY = (y - this.map_vars.min.y)/this.map_vars.grid_size;

                let wind = new Vec2(this.getValue(0,now,x,y,Math.PI*2),this.getValue(1,now,x,y,this.map_vars.grid_size));
                let stream = new Vec2(this.getValue(2,now,x,y,Math.PI*2),this.getValue(3,now,x,y,this.map_vars.grid_size));
                map[map.length - 1].push({wind:wind,stream:stream});
            }
        }
        this.time.push(map);
    }


}
Object.assign(TimeMap.prototype,{
    getWind: function(time, x, y){
        return this.time[time][x][y].wind;
    },
    getStream: function(time, x, y){
        return this.time[time][x][y].stream;
    }
});

function visualizeTimeMap(map, ctx, start, end){
    ctime++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let x = map.map_vars.min.x; x <= map.map_vars.max.x; x+= map.map_vars.grid_size){
        for(let y = map.map_vars.min.y; y <= map.map_vars.max.y; y+= map.map_vars.grid_size){
            let arrayX = (x - map.map_vars.min.x)/map.map_vars.grid_size;
            let arrayY = (y - map.map_vars.min.y)/map.map_vars.grid_size;

            let wind = map.getWind(ctime%map.time.length, arrayX,arrayY);
            let stream = map.getStream(ctime%map.time.length, arrayX,arrayY);

            let canvasX = x - map.map_vars.min.x + padding;
            let canvasY = y - map.map_vars.min.y + padding;
            ctx.beginPath();
            ctx.strokeStyle = "#3071A9";
            ctx.moveTo(canvasX, canvasY);
            ctx.lineTo(canvasX + (wind.f * Math.cos(wind.a)), canvasY + (wind.f * Math.sin(wind.a)));
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.strokeStyle = "#a95839";
            ctx.moveTo(canvasX, canvasY);
            ctx.lineTo(canvasX + (stream.f * Math.cos(stream.a)), canvasY + (stream.f * Math.sin(stream.a)));
            ctx.stroke();
            ctx.closePath();
        }
    }

    ctx.strokeStyle = "#36a955";
    ctx.beginPath();
    ctx.arc(start.x  - map.map_vars.min.x + padding, start.y  - map.map_vars.min.y + padding, 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(end.x  - map.map_vars.min.x + padding, end.y  - map.map_vars.min.y + padding, 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
}

let ctx = canvas.getContext("2d");

let start = {x:-200,y:-200};
let end = {x:200,y:200};
let ctime = 0;
setInterval(visualizeTimeMap,10,map, ctx, start, end);



function polarLookup(wind, stream){
    let speed = lookuptable[wind][stream];
    return speed;
}

function plotDistance(pos, wind, stream){
    plotpoints = [];
    for(let a = 0; a < Math.PI*2; a+=.1){
        let speed = polarLookup(wind - a, stream - a);
        plotpoints.push (pos + speed * Math.cos(a));
    }
    return plotpoints;
}

function mergePP(){
    let points = plotDistance(pos, wind, stream);
}
/*const boat_stats =

[0 -> Math.PI] lijst met hoeken wind
[0 -> windkracht] lijst met hoeken water




* */