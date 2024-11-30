// Función para cargar datos de la API REST
async function fetchTopology() {
    
    try {
        // Realiza la solicitud GET al servidor FastAPI
        //let ipAddress = '10.132.58.152'; // Direccion IP del servidor Fast Api 
        let ipAddress = '192.168.18.66';
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
function drawTopology(nodes, edges) {
    const svgWidth = 800; // Ancho del SVG más compacto
    const svgHeight = 600; // Alto del SVG más compacto

    // Crear el SVG
    const svg = d3.select("#data-container")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("background-color", "#f4f4f9") // Fondo claro
        .style("border", "1px solid #ccc"); // Borde opcional

    // Tooltip para mostrar información al pasar el mouse
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 0 5px rgba(0,0,0,0.3)")
        .style("display", "none")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "12px");

    // Configurar simulación de fuerzas
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges).id(d => d.id).distance(80)) // Reducir distancia entre nodos
        .force("charge", d3.forceManyBody().strength(-200)) // Ajustar fuerza para compactar
        .force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2));

    // Dibujar enlaces
    const link = svg.append("g")
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2);

    // Dibujar nodos
    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 15)
        .attr("fill", d => (d.type === "switch" ? "blue" : "green"))
        .on("mouseover", function (event, d) {
            let tooltipContent = `<strong>Tipo:</strong> ${d.type}<br>`;
            tooltipContent += `<strong>Identificador:</strong> ${d.label}<br>`;
            if (d.type === "switch") {
                tooltipContent += `<strong>DPID:</strong> ${d.id}<br>`;
            } else if (d.type === "host") {
                tooltipContent += `<strong>MAC:</strong> ${d.id}<br>`;
            }
            tooltip.html(tooltipContent)
                .style("display", "block")
                .style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mousemove", function (event) {
            tooltip.style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        })
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded));

    // Etiquetas para nodos
    const labels = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("dy", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d.label);

    // Actualizar posiciones en cada tick
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

// Llamar a la función para cargar los datos al cargar la 
fetchTopology();
