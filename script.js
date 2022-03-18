const appendTilesToBody = tiles => tiles.forEach( tile => document.body.appendChild(tile));
const createTiles = projects =>  Object.values(projects).map(createTile);
const createTile = site => {
    let title = document.createElement("h2");
    let subtitle = document.createElement("h3");
    let assignment = document.createElement("p");
    let logo, thumbnail, container, technologies, darkLogo;
    if (site.link) {
        container = document.createElement("a");
        container.href = site.link;
        container.target = "_blank";
    } else {
        container = document.createElement("div");
    }

    thumbnail = document.createElement("img");
    thumbnail.src = "img/" + site.img + "/thumbnail.png";

    logo = document.createElement("img");
    logo.src = "img/" + site.img + "/logo.png";

    if (site.hasDarkModeAlt) {
        darkLogo = document.createElement("img");
        darkLogo.src = "img/" + site.img + "/logo-dark.png";
    }


    title.innerText = site.title ?? '';
    subtitle.innerText = site.subtitle;
    assignment.innerText = site.assignment;

    let clipper = document.createElement("div");
    clipper.classList.add("clipper");
    container.appendChild(clipper);
    clipper.appendChild(thumbnail);
    if (darkLogo) clipper.appendChild(darkLogo);
    clipper.appendChild(logo);
    if (site.title) clipper.appendChild(title);
    if (site.subtitle) clipper.appendChild(subtitle);
    if(site.technologies){
        technologies = document.createElement("div");
        technologies.classList.add('technologies');
        for(technology in site.technologies){
            let thisTech = document.createElement("span");
            thisTech.innerHTML = site.technologies[technology];
            thisTech.classList.add(toClassName(site.technologies[technology]));
            thisTech.setAttribute("onclick", "activate(this.classList)");
            technologies.appendChild(thisTech);
            container.appendChild(technologies);
        }
    }

    container.classList.add("container");
    logo.classList.add("logo");
    logo.classList.add("light");
    darkLogo?.classList.add("logo");
    darkLogo?.classList.add("dark");
    thumbnail.classList.add("thumbnail");
    return container;
}
const toClassName = name => name.split(' ').join('_').split('.').join('-').toLowerCase();

fetch('projects.json')
    .then(res => res.json())
    .then(createTiles)
    .then(appendTilesToBody)
    .catch(e=> console.error(e));
