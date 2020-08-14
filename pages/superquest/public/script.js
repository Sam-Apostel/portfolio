var NIS = [...document.getElementsByTagName('navItem')];
NIS.forEach(NI => NI.addEventListener("click", function(e){selectChat(e.target)},false));

function selectChat(selected){
    NIS.forEach(NI => NI.classList.remove('selected'));
    (selected.tagName == "NAVITEM"? selected : selected.parentElement).classList.add('selected');
}

function load(){
    // if active session
        // register on server
        // load chat history
    // if inactive session
        // login screen with picture and username filled out
    // else
        // register screen
}
function register(username, password, avatar, email){
    // send data to server
    login(username, password);
}
function login(username, password){
    // verificate
    // return avatar, displayname, chatheads
    load();
}
function logout(){
    // destroy session
}
function askForData(data){
    // send request
    // process data
}
function askForHead(id){
    askForData({"head": id});
}
function askForMessage(head, id, amount){
    askForData({"message": id, "amount": amount});
}

function Response(content, timestamp){
    this.content = content;
    this.stamp = timestamp;
}
var socket = io();
var input = document.getElementById('input');
function bubble(type, content, timestamp){
    content = content.split("&nbsp;").join("").split("<br>").join("") || false;
    if(content){
        var message = document.createElement('message');
        message.setAttribute('timestamp', timestamp);
        message.setAttribute('content', content);
        message.classList.add(type);
        input.parentElement.insertBefore(message, input);
        var whitespace = document.createTextNode("\u000A");
        input.parentElement.insertBefore(whitespace, input);
        return new Response(content, timestamp);
    }
    return false;
}
input.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();

        var time = new Date();
        var stamp =  time.getHours() + ":" +time.getMinutes();
        var r = bubble('sent', input.innerHTML, stamp)
        if (r){
            socket.emit('chat message', r);
        }
        input.innerHTML = "&nbsp;";
    }
});
socket.on('chat message', function(msg){
    bubble('received', msg.content, msg.stamp);
});
socket.on('chat connect', function(msg){

});
socket.on('chat disconnect', function(msg){

});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}