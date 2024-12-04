// Función para cargar datos de la API REST
document.getElementById("updateButton").addEventListener("click", fetchTopology);

async function fetchTopology() {
    
    try {
        // Realiza la solicitud GET al servidor FastAPI
        //let ipAddress = '10.132.58.152'; // Direccion IP del servidor Fast Api 
        let ipAddress = '192.168.18.231';
        const response = await fetch(`http://${ipAddress}:8000/topology`);
        
        // Verifica si la respuesta es exitosa
        if (!response.ok) {
            throw new Error(`Error al obtener la topología: ${response.statusText}`);
        }

        // Procesa la respuesta JSON
        const { switches, links, hosts } = await response.json();
        
        console.log("Switches:", switches);
        console.log("Links:", links);
        console.log("Hosts:", hosts);

        // Procesar los datos para la visualización
        const { nodes, edges } = processData(switches, links, hosts);
        // Verificar si todos los nodos referenciados en edges existen en nodes
        console.log("Nodos procesados:", nodes);
        console.log("Enlaces procesados:", edges);
        edges.forEach(edge => {
            const sourceExists = nodes.some(node => node.id === edge.source);
            const targetExists = nodes.some(node => node.id === edge.target);
        
            if (!sourceExists || !targetExists) {
                console.error(`Nodo no encontrado en el enlace:`, edge);
            }
        });
        drawTopology(nodes, edges);

                // chat
                console.log("Enlaces procesados:", edges);


    } catch (error) {
        console.error("Error fetching topology data:", error);
    }
}

// Función para procesar datos
function processData(switches, links, hosts) {
    const nodes = [];
    const edges = [];
    let switchCounter = 1; // Contador para switches
    let hostCounter = 1;   // Contador para hosts

    // Añadir switches como nodos
    // Procesar switches con DPID
    switches.forEach((sw) => {
        const switchLabel = `s${switchCounter++}`; // Asignar etiqueta s1, s2, etc.
        nodes.push({ id: sw.dpid, type: "switch", label: switchLabel });
    });

    // Añadir hosts como nodos y enlaces a switches
    hosts.sort((a, b) => a.mac.localeCompare(b.mac)); // Ordenar por dirección MAC
    hosts.forEach((host) => {
        const hostLabel = `h${hostCounter++}`; // Asignar etiqueta h1, h2, etc.
        nodes.push({ id: host.mac, type: "host", label: hostLabel });
        edges.push({
            source: host.port.dpid,
            target: host.mac,
        });
    });

    // Añadir enlaces entre switches
    links.forEach((link) => {
        edges.push({
            source: link.src.dpid,
            target: link.dst.dpid,
        });
    });

    return { nodes, edges };
}

// Función para graficar la topología
function processData(switches, links, hosts) {
    const nodes = [];
    const edges = [];

    // Ordenar switches por DPID
    switches.sort((a, b) => parseInt(a.dpid, 16) - parseInt(b.dpid, 16));
    hosts.sort((a, b) => a.mac.localeCompare(b.mac));

    // Asignar etiquetas a los switches
    switches.forEach((sw, index) => {
        nodes.push({
            id: sw.dpid, // DPID del switch
            type: "switch",
            label: `S${index + 1}`, // Etiqueta del switch (S1, S2, ...)
        });
    });

    // Asignar etiquetas a los hosts
    hosts.forEach((host, index) => {
        nodes.push({
            id: host.mac, // Dirección MAC del host
            type: "host",
            label: `H${index + 1}`, // Etiqueta del host (H1, H2, ...)
        });

        // Crear enlaces de los hosts a sus switches
        edges.push({
            source: host.port.dpid,
            target: host.mac,
        });
    });

    // Procesar enlaces entre switches
    links.forEach((link) => {
        edges.push({
            source: link.src.dpid,
            target: link.dst.dpid,
        });
    });

    return { nodes, edges };
}


// Función para graficar la topología
function drawTopology(nodes, edges) {
    // Limpiar el contenedor antes de dibujar
    d3.select("#data-container").selectAll("*").remove();

    // Crear el SVG con un grupo (`g`) interno para manejar el zoom
    const svg = d3.select("#data-container")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("background-color", "#f9f9f9");

    // Crear un grupo principal para la topología
    const g = svg.append("g");

    // Añadir comportamiento de zoom
    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Crear el tooltip
    const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip") // Usa la clase definida en CSS
    .style("position", "absolute")
    .style("visibility", "hidden"); // Oculto por defecto

    // Configurar simulación de fuerzas
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(0, 0))
        .force("collide", d3.forceCollide(50));

    const link = g.append("g")
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2);

    const node = g.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 15)
        .attr("fill", d => (d.type === "switch" ? "blue" : "green"))
        .on("mouseover", (event, d) => showTooltip(event, d)) // Mostrar tooltip
        .on("mouseout", () => hideTooltip()) // Ocultar tooltip
        .on("mousemove", (event) => moveTooltip(event)) // Mover tooltip
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded));

    const labels = g.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("dy", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d.label);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    // Ajustar el viewBox al final de la simulación
    simulation.on("end", () => {
        const xExtent = d3.extent(nodes, d => d.x);
        const yExtent = d3.extent(nodes, d => d.y);

        const padding = 50;
        const width = xExtent[1] - xExtent[0] + padding * 2;
        const height = yExtent[1] - yExtent[0] + padding * 2;

        svg.attr("viewBox", `${xExtent[0] - padding} ${yExtent[0] - padding} ${width} ${height}`);
    });

    // Funciones de tooltip
    function showTooltip(event, d) {
        const content = d.type === "switch"
            ? `<b>Switch</b><br>Número: ${d.label}<br>DPID: ${d.id}`
            : `<b>Host</b><br>Número: ${d.label}<br>Dirección: ${d.id}`;
    
        tooltip.html(content)
            .style("visibility", "visible")
            .style("background-color", "#ffffff") // Fondo blanco sólido
            .style("color", "#000000") // Texto negro
            .style("padding", "10px")
            .style("border-radius", "8px")
            .style("border", "1px solid rgba(0, 0, 0, 0.2)")
            .style("box-shadow", "0px 4px 10px rgba(0, 0, 0, 0.25)")
            .style("font-size", "14px")
            .style("top", `${event.pageY + 10}px`) // Posición dinámica
            .style("left", `${event.pageX + 10}px`);
    }
    
    // Función para mover el tooltip
    function moveTooltip(event) {
        tooltip.style("top", `${event.pageY + 10}px`)
            .style("left", `${event.pageX + 10}px`);
    }
    
    // Función para ocultar el tooltip
    function hideTooltip() {
        tooltip.style("visibility", "hidden");
    }

    // Funciones de arrastre
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}


// Cargar la topología al cargar la página
fetchTopology();
