const form = document.getElementById('ryuForm');
const responseMessage = document.getElementById('responseMessage');
let ipAddress = '192.168.18.231';

form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Evita que la página se recargue
  const appName = document.getElementById('appName').value;
  if (!appName) {
    responseMessage.textContent = "Por favor, ingresa el nombre de la aplicación.";
    responseMessage.className = "error";
    return;
  }

  try {
    // Realiza una solicitud POST al backend
    const response = await fetch(`http://${ipAddress}:8000/run_ryu_app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_name: appName })
    });

    const result = await response.json();
    if (response.ok) {
      responseMessage.textContent = result.message;
      responseMessage.className = "success";
    } else {
      responseMessage.textContent = result.detail || "Error desconocido.";
      responseMessage.className = "error";
    }
  } catch (error) {
    responseMessage.textContent = "No se pudo conectar al backend.";
    responseMessage.className = "error";
  }
});
