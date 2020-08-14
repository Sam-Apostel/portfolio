// after load of https://www.marinetraffic.com/en/ais/home/centerx:-1.4/centery:50.4/zoom:9


// remove ads
var ad1 = document.getElementsByClassName("flex-0-0-auto")[3];
var ad2 = ad1.previousElementSibling.childNodes[0].childNodes[1];
ad1.parentNode.removeChild(ad1);
ad2.parentNode.removeChild(ad2);

// open fleets tab
document.getElementById("main-panel-fleets-btn").click();

// show fleets
document.getElementById("mt_checkbox_id_2").click();