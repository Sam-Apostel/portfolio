const appendTilesToBody = tiles => tiles.forEach( tile => document.body.appendChild(tile));
const createTiles = projects =>  Object.values(projects).map(createTile);
const createTile = site => {
    let title = document.createElement("h2");
    let subtitle = document.createElement("h3");
    let assignment = document.createElement("p");
    let logo, thumbnail, container, technologies;
    if(site.link){
        container = document.createElement("a");
        container.href = site.link;
        container.target = "_blank";
    }else{
        container = document.createElement("div");
    }
    if(site.frame){
        thumbnail = document.createElement("iframe");
        thumbnail.src = site.link;
        thumbnail.height = 450;
        thumbnail.setAttribute("style", "border: none;transform: scale(0.5);width:800px !important;transform-origin:0 0;");
    }else{
        thumbnail = document.createElement("img");
        thumbnail.src = "img/" + site.img + "/thumbnail.png";
    }
    if(site.img){
        logo = document.createElement("img");
        logo.src = "img/" + site.img + "/logo.png";
    }
    if(site.logo === "creative header"){
        logo = document.createElement("div");
        logo.classList.add("ch-container");
        let rotator = document.createElement("div");
        rotator.classList.add("creative-header");
        rotator.setAttribute("style", "border-radius: 53px 47px 43px 57px/ 40px 33px 67px 60px;transform: rotate(89.19999999988431deg)");
        let image = document.createElement("div");
        image.setAttribute("style", "transform: rotate(-89.19999999988431deg);");
        rotator.appendChild(image);
        logo.appendChild(rotator);
    }

    title.innerText = site.title;
    subtitle.innerText = site.subtitle;
    assignment.innerText = site.assignment;

    let clipper = document.createElement("div");
    clipper.classList.add("clipper");
    container.appendChild(clipper);
    clipper.appendChild(thumbnail);
    clipper.appendChild(logo);
    clipper.appendChild(title);
    clipper.appendChild(subtitle);
    if(site.technologies){
        technologies = document.createElement("span");
        for(technology in site.technologies){
            let thisTech = document.createElement("span");
            thisTech.innerHTML = site.technologies[technology];
            thisTech.classList.add(toClassName(site.technologies[technology]));
            thisTech.setAttribute("onclick", "activate(this.classList)");
            technologies.appendChild(thisTech);
            container.appendChild(technologies);
        }
    }
    clipper.appendChild(assignment);


    container.classList.add("container");
    logo.classList.add("logo");
    thumbnail.classList.add("thumbnail");
    return container;
}
const toClassName = name => name.split(' ').join('_').split('.').join('-').toLowerCase();

fetch('projects.json')
    .then(res => res.json())
    .then(createTiles)
    .then(appendTilesToBody)
    .catch(e=> console.error(e));
