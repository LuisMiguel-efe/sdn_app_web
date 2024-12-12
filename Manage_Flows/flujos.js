// Variables globales
let ipAddress = '192.168.122.234'; // Direccion IP del servidor Fast Api  (Misma que Ryu Server)

// DOMContentLoaded: Configuración inicial al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  setupFlowForm();
  setupListFlowsForm();
  setupDeleteFlowForm();

  // Selección inicial de acción
  document.getElementById("btn_flood").click();
});

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
    responseElement.textContent = "Adding flow...";

    try {
      
      const response = await fetch(`http://${ipAddress}:8000/add_flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        });

      if (response.ok) {
        const result = await response.json();
        displayResponseMessage(`Flow added successfully: ${JSON.stringify(result)}`, true, responseElement);
      } else {
        displayResponseMessage(`Error configuring flow: ${response.statusText}`, false, responseElement);
      }
    } catch (error) {
      displayResponseMessage(`Connection error: ${error.message}`, false, responseElement);
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
        alert(`Error listing flows: ${response.statusText}`);
      }
    } catch (error) {
      alert(`Connection error: ${error.message}`);
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
        displayResponseMessage(`Error deleting flow: ${response.statusText}`, false, responseElement);
      }
    } catch (error) {
      displayResponseMessage(`Connection error: ${error.message}`, false, responseElement);
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
function openPopup(url) {
  // Abrir una nueva ventana emergente con dimensiones específicas
  window.open(
    url, // URL del archivo
    '_blank', // Abrir en una nueva ventana
    'width=800,height=600,scrollbars=yes,resizable=yes' // Especificaciones de la ventana
  );
}