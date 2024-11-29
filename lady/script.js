// URL base del controlador Ryu
const baseURL = "http://10.132.52.148:8080/v1.0/topology";

// Función para cargar datos de la API REST
async function fetchTopology() {
    try {
        const switches = await fetch(`${baseURL}/switches`).then(res => res.json());
        const links = await fetch(`${baseURL}/links`).then(res => res.json());
        const hosts = await fetch(`${baseURL}/hosts`).then(res => res.json());

        console.log("Switches:", switches);
        console.log("Links:", links);
        console.log("Hosts:", hosts);

        // Renderizar datos en la página
        renderData("Switches", switches);
        renderData("Links", links);
        renderData("Hosts", hosts);

        return { switches, links, hosts };
    } catch (error) {
        console.error("Error fetching topology data:", error);
    }
}

// Función para renderizar datos en la página
function renderData(title, data) {
    const container = document.getElementById("data-container");

    const section = document.createElement("div");
    section.className = "section";

    const header = document.createElement("h2");
    header.innerText = title;
    section.appendChild(header);

    const pre = document.createElement("pre");
    pre.innerText = JSON.stringify(data, null, 2); // Formato bonito para JSON
    section.appendChild(pre);

    container.appendChild(section);
}

// Llama a la función para cargar los datos al cargar la página
fetchTopology();

