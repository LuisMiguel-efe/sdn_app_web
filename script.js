document.getElementById("flowForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // Evitar recarga de la página
  
  const formData = new FormData(e.target);
  const dpid = parseInt(formData.get("dpid"));
  const cookie = parseInt(formData.get("cookie"));
  const idle_timeout = parseInt(formData.get("idle_timeout"));
  const hard_timeout = parseInt(formData.get("hard_timeout"));
  const priority = parseInt(formData.get("priority"));
  
  const data = {
    dpid,
    cookie,
    cookie_mask: 1,
    table_id: 0,
    idle_timeout,
    hard_timeout,
    priority,
    flags: 1,
    match: {},
    actions: [],
};
/*
  const data = {
    dpid: parseInt(formData.get("dpid")),
    cookie: parseInt(formData.get("cookie")),
    cookie_mask:1,
    table_id: 0,
    idle_timeout: parseInt(formData.get("idle_timeout")),
    hard_timeout: parseInt(formData.get("hard_timeout")),
    priority: parseInt(formData.get("priority")),
    flags: 1,
    match: {
      in_port: parseInt(formData.get("in_port")),
    },
    actions: [
      {
        type: "OUTPUT",
        port: parseInt(formData.get("out_port")),
      },
    ],
  };
  
*/
if (currentAction === "output_ports") {
  data.match.in_port = parseInt(formData.get("in_port"));
  data.actions.push({
      type: "OUTPUT",
      port: parseInt(formData.get("out_port")),
  });
} else if (currentAction === "output_ip") {
  data.match.eth_type = 2048;
  data.match.ipv4_src = formData.get("ip_src");
  data.match.ipv4_dst = formData.get("ip_dst");
  data.actions.push({
      type: "OUTPUT",
      port: parseInt(formData.get("out_port")),
  });
} else if (currentAction === "normal") {
  data.actions.push({
      type: "OUTPUT",
      port: "NORMAL",
  });
} else if (currentAction === "flood") {
  data.actions.push({
      type: "OUTPUT",
      port: "FLOOD",
  });
} else if (currentAction === "drop") {
  data.actions = []; // Sin acciones, lo que implica descartar el paquete
}
  const responseElement = document.getElementById("response");
  responseElement.textContent = "Enviando flujo...";

  try {
    const response = await fetch("http://localhost:8000/add_flow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      responseElement.textContent = `Respuesta: Flujo configurado exitosamente. ${JSON.stringify(result)}`;
      responseElement.style.backgroundColor = "#DFF2BF";  // Color verde de éxito
      responseElement.style.color = "#4F8A10";  // Texto verde
    } else {
      responseElement.textContent = `Error al configurar flujo: ${response.status} ${response.statusText}`;
      responseElement.style.backgroundColor = "#FFBABA";  // Color rojo de error
      responseElement.style.color = "#D8000C";  // Texto rojo
    }
  } catch (error) {
    responseElement.textContent = `Error de conexión: ${error.message}`;
    responseElement.style.backgroundColor = "#FFBABA";
    responseElement.style.color = "#D8000C";
  }
});

document.getElementById("listFlowsForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const dpid = document.getElementById("list_dpid").value;
    const flowsTableBody = document.getElementById("flowsTableBody");
    flowsTableBody.innerHTML = ""; // Limpiar la tabla

    try {
        const response = await fetch(`http://localhost:8000/list_flows/${dpid}`);
        if (response.ok) {
            const flows = await response.json();
            flows.forEach((flow) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${flow.cookie}</td>
                    <td>${JSON.stringify(flow.match)}</td>
                    <td>${JSON.stringify(flow.actions)}</td>
                `;
                flowsTableBody.appendChild(row);
            });
        } else {
            alert(`Error al listar flujos: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        alert(`Error de conexión: ${error.message}`);
    }
});

document.getElementById("deleteFlowForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const dpid = document.getElementById("delete_dpid").value;
  const cookie = document.getElementById("delete_cookie").value;
  const responseElement = document.getElementById("response");  // Usamos el mismo contenedor de respuesta

  try {
    const response = await fetch("http://localhost:8000/delete_flow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dpid: parseInt(dpid), cookie: parseInt(cookie) }),
    });

    if (response.ok) {
      const result = await response.json();
      responseElement.textContent = `Resultado: ${result.message}`;
      responseElement.style.backgroundColor = "#DFF2BF";  // Color verde de éxito
      responseElement.style.color = "#4F8A10";  // Texto verde
    } else {
      responseElement.textContent = `Error al eliminar flujo: ${response.status} ${response.statusText}`;
      responseElement.style.backgroundColor = "#FFBABA";  // Color rojo de error
      responseElement.style.color = "#D8000C";  // Texto rojo
    }
  } catch (error) {
    responseElement.textContent = `Error de conexión: ${error.message}`;
    responseElement.style.backgroundColor = "#FFBABA";
    responseElement.style.color = "#D8000C";
  }
});

// Hacer el campo de puerto de salida dinámico
function changeAction(action) {
  currentAction = action;
  // Ocultar o mostrar campos según la acción seleccionada
  const inPortGroup = document.getElementById('in_port_group');
  const outPortGroup = document.getElementById('out_port_group');
  const ipGroupIn = document.getElementById('in_ip_group');
  const ipGroupOut = document.getElementById('out_ip_group');
  if (action === 'output_ports') {
    inPortGroup.classList.remove('hidden');
    outPortGroup.classList.remove('hidden');
    ipGroupIn.classList.add('hidden');
    ipGroupOut.classList.add('hidden');
  } else if (action === 'output_ip') {
    ipGroupIn.classList.remove('hidden');
    ipGroupOut.classList.remove('hidden');
    inPortGroup.classList.add('hidden'); //Desaparecer
    outPortGroup.classList.remove('hidden'); // Aparecer
  } else if (action === 'normal' || action === 'flood' || action === 'drop') {
    inPortGroup.classList.remove('hidden');
    outPortGroup.classList.add('hidden');
    ipGroupIn.classList.add('hidden');
    ipGroupOut.classList.add('hidden');
  }
}
// Selección inicial por defecto
document.getElementById('btn_output_ports').click();