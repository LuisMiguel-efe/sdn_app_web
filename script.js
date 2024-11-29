// Variables globales
let currentAction = "output_ports"; // Acción seleccionada inicialmente
let ipAddress = '10.132.58.38'; // Direccion IP del servidor Fast Api 
// DOMContentLoaded: Configuración inicial al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  //setupRyuAppForm();
  setupFlowForm();
  setupListFlowsForm();
  setupDeleteFlowForm();

  // Selección inicial de acción
  document.getElementById("btn_flood").click();
});

/**
 * Configura el formulario para iniciar aplicaciones de Ryu
 */
//function setupRyuAppForm() {   }

/**
 * Configura el formulario para agregar flujos
 */
function setupFlowForm() {
  const form = document.getElementById("flowForm");
  if (!form) {
    console.error("Formulario de flujos no encontrado.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = createFlowData(new FormData(e.target));
    const responseElement = document.getElementById("response");
    responseElement.textContent = "Enviando flujo...";

    try {
      
      const response = await fetch(`http://${ipAddress}:8000/add_flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        });

      if (response.ok) {
        const result = await response.json();
        displayResponseMessage(`Flujo configurado exitosamente: ${JSON.stringify(result)}`, true, responseElement);
      } else {
        displayResponseMessage(`Error al configurar flujo: ${response.statusText}`, false, responseElement);
      }
    } catch (error) {
      displayResponseMessage(`Error de conexión: ${error.message}`, false, responseElement);
    }
  });
}

/**
 * Configura el formulario para listar flujos
 */
function setupListFlowsForm() {
  const form = document.getElementById("listFlowsForm");
  if (!form) {
    console.error("Formulario de listado de flujos no encontrado.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dpid = document.getElementById("list_dpid").value;
    const flowsTableBody = document.getElementById("flowsTableBody");
    flowsTableBody.innerHTML = ""; // Limpiar tabla

    try {
      const response = await fetch(`http://${ipAddress}:8000/list_flows/${dpid}`);
      if (response.ok) {
        const flows = await response.json();
        populateFlowsTable(flows, flowsTableBody);
      } else {
        alert(`Error al listar flujos: ${response.statusText}`);
      }
    } catch (error) {
      alert(`Error de conexión: ${error.message}`);
    }
  });
}

/**
 * Configura el formulario para eliminar flujos
 */
function setupDeleteFlowForm() {
  const form = document.getElementById("deleteFlowForm");
  if (!form) {
    console.error("Formulario de eliminación de flujos no encontrado.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dpid = document.getElementById("delete_dpid").value;
    const cookie = document.getElementById("delete_cookie").value;
    const responseElement = document.getElementById("response");

    try {
      const response = await fetch(`http://${ipAddress}:8000/delete_flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dpid: parseInt(dpid), cookie: parseInt(cookie) }),
      });

      if (response.ok) {
        const result = await response.json();
        displayResponseMessage(result.message, true, responseElement);
      } else {
        displayResponseMessage(`Error al eliminar flujo: ${response.statusText}`, false, responseElement);
      }
    } catch (error) {
      displayResponseMessage(`Error de conexión: ${error.message}`, false, responseElement);
    }
  });
}

/**
 * Cambia los campos visibles según la acción seleccionada
 * @param {string} action - Acción seleccionada
 */
function changeAction(action, button) {
  // Marcar el botón seleccionado
  document.querySelectorAll('.menu-bar button').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  
  currentAction = action;
  const groups = {
    inPortGroup: document.getElementById("in_port_group"),
    outPortGroup: document.getElementById("out_port_group"),
    ipGroupIn: document.getElementById("in_ip_group"),
    ipGroupOut: document.getElementById("out_ip_group"),
    macGroupIn: document.getElementById("in_mac_group"),
    macGroupOut: document.getElementById("out_mac_group"),
  };

  switch (action) {
    case "output_ports":
      toggleGroups(groups, ["inPortGroup", "outPortGroup"], ["ipGroupIn", "ipGroupOut", "macGroupIn", "macGroupOut"]);
      break;
    case "output_ip":
      toggleGroups(groups, ["inPortGroup","ipGroupIn", "ipGroupOut", "outPortGroup"], ["macGroupIn", "macGroupOut"]);
      break;
    case "output_mac":
      toggleGroups(groups, ["inPortGroup","macGroupIn", "macGroupOut", "outPortGroup"], ["ipGroupIn", "ipGroupOut"]);
      break;
    case "flood":
      toggleGroups(groups, [], ["inPortGroup", "outPortGroup", "ipGroupIn", "ipGroupOut", "macGroupIn", "macGroupOut"]);
      break;
    case "normal":
    case "drop":
      toggleGroups(groups, ["inPortGroup"], ["outPortGroup", "ipGroupIn", "ipGroupOut", "macGroupIn", "macGroupOut"]);
      break;
  }
}

/**
 * Crea datos del flujo basado en el formulario
 */
function createFlowData(formData) {
  const data = {
    dpid: parseInt(formData.get("dpid")),
    cookie: parseInt(formData.get("cookie")),
    cookie_mask: 1,
    table_id: 0,
    idle_timeout: parseInt(formData.get("idle_timeout")),
    hard_timeout: parseInt(formData.get("hard_timeout")),
    priority: parseInt(formData.get("priority")),
    flags: 1,
    match: {},
    actions: [],
  };

  // Agregar configuraciones basadas en la acción seleccionada
  if (currentAction === "output_ports") {
    data.match.in_port = parseInt(formData.get("in_port"));
    data.actions.push({ type: "OUTPUT", port: parseInt(formData.get("out_port")) });
  } else if (currentAction === "output_ip") {
    data.match.in_port = parseInt(formData.get("in_port"));
    data.match.eth_type = 2048;
    data.match.ipv4_src = formData.get("ip_src");
    data.match.ipv4_dst = formData.get("ip_dst");
    data.actions.push({ type: "OUTPUT", port: parseInt(formData.get("out_port")) });
  } else if (currentAction === "output_mac") {
    data.match.in_port = parseInt(formData.get("in_port"));
    data.match.eth_src = formData.get("mac_src");
    data.match.eth_dst = formData.get("mac_dst");
    data.actions.push({ type: "OUTPUT", port: parseInt(formData.get("out_port")) });
  }else if (currentAction === "normal") {
    data.match.in_port = parseInt(formData.get("in_port"));
    data.actions.push({ type: "OUTPUT", port: "NORMAL" });
  } else if (currentAction === "flood") {
    data.actions.push({ type: "OUTPUT", port: "FLOOD" });
  } else if (currentAction === "drop") {
    data.match.in_port = parseInt(formData.get("in_port"));
    data.actions = [];
  }

  return data;
}

/**
 * Rellena la tabla de flujos
 */
function populateFlowsTable(flows, tableBody) {
  flows.forEach((flow) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${flow.cookie}</td>
      <td>${JSON.stringify(flow.match)}</td>
      <td>${JSON.stringify(flow.actions)}</td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Cambia la visibilidad de los grupos
 */
function toggleGroups(groups, show, hide) {
  show.forEach((group) => groups[group]?.classList.remove("hidden"));
  hide.forEach((group) => groups[group]?.classList.add("hidden"));
}

/**
 * Muestra un mensaje de respuesta en la interfaz
 */
function displayResponseMessage(message, success, element) {
  element.textContent = message;
  element.style.backgroundColor = success ? "#DFF2BF" : "#FFBABA";
  element.style.color = success ? "#4F8A10" : "#D8000C";
}


/*
/ APLICACIONES DE RYU
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ryuAppForm");
  console.log(form);  // Depuración: verifica si el formulario se encuentra
  
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const appName = document.getElementById("ryu_app").value;
      const responseElement = document.getElementById("response");

      responseElement.textContent = "Iniciando aplicación Ryu...";

      try {
        const response = await fetch("http://localhost:8000/run_ryu_app", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ app_name: appName }),
        });

        if (response.ok) {
          const result = await response.json();
          responseElement.textContent = result.message;
          responseElement.style.backgroundColor = "#DFF2BF";
          responseElement.style.color = "#4F8A10";
        } else {
          responseElement.textContent = `Error: ${response.statusText}`;
          responseElement.style.backgroundColor = "#FFBABA";
          responseElement.style.color = "#D8000C";
        }
      } catch (error) {
        responseElement.textContent = `Error de conexión: ${error.message}`;
        responseElement.style.backgroundColor = "#FFBABA";
        responseElement.style.color = "#D8000C";
      }
    });
  } else {
    console.error("El formulario no fue encontrado.");
  }
});


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
  data.match.in_port = parseInt(formData.get("in_port"));
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
  data.match.in_port = parseInt(formData.get("in_port"));
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
  } else if (action === 'flood') {
    inPortGroup.classList.add('hidden');
    outPortGroup.classList.add('hidden');
    ipGroupIn.classList.add('hidden');
    ipGroupOut.classList.add('hidden');
  } else if (action === 'normal' || action === 'drop') {
    inPortGroup.classList.remove('hidden');
    outPortGroup.classList.add('hidden');
    ipGroupIn.classList.add('hidden');
    ipGroupOut.classList.add('hidden');
  }
}
// Selección inicial por defecto
document.getElementById('btn_output_ports').click();

*/