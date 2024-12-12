Descripción del Proyecto: Este proyecto es una aplicación web para gestionar reglas de flujo, ejecutar aplicaciones en el controlador Ryu y observar la topología de red que se está ejecutando en mininet. El proyecto está diseñado para trabajar con switches compatibles con OpenFlow 1.3. Permite seleccionar, ejecutar y monitorear aplicaciones desde una interfaz web intuitiva.

Características Principales
* Lista predefinida de aplicaciones compatibles con OpenFlow 1.3.
* Conexión con el backend para iniciar aplicaciones de forma remota.
* Código modular y fácil de entender para facilitar la extensión del proyecto.
Tecnologías Utilizadas
* Frontend
	- HTML, CSS
	- JavaScript
* Backend
	- FastAPI (Python)
	- Uvicorn (Servidor ASGI)
	- Controlador SDN
	- Ryu (OpenFlow 1.3)
Requisitos Previos
* Python 3.8 o superior instalado en tu máquina.
* Controlador Ryu instalado (compatible con OpenFlow 1.3).
* Dependencias de Python: pip install fastapi uvicorn pydantic
* Acceso a una red SDN con switches compatibles con OpenFlow 1.3. (MININET)

TUTORIAL DE EJECUCIÓN
1) Obtener la dirección IP de Ryu Server, esta dirección será importante y deberá escribirse en cada archivo de JavaScript de la pagina web, en el backend.py y en wsgi.py (localhost).
2) En Ryu Server añadir el archivo backend.py en la carpeta: ...Ryu/Apps/
3) Ejecutar el servidor backend con el comando: uvicorn backend:app --host 0.0.0.0 --port 8000. Este servidor actuará como intermediario entre la app web y Ryu resolviendo los problemas de CORS y reenviando las solicitudes hechas desde la página web en un formato compatible con las aplicaciones de Ryu (ofctl_rest, rest_topology).
4) Una vez configurada la direccion ip del ryu server en todos los archivos .js (flujos.js, run_apps.js y topology.js) ejecutamos la aplicación web con el comando http-server, o de forma local.
5) Crear la red en mininet con direccion del controlador (ip del ryu server) y con switches compatibles con el protocolo Open Flow 1.3
6) Entrar en la app web en su maquina fisica, y ejecutar cualquier aplicación, por defecto siempre se ejecutará ofctl_rest y rest_topology para permitir el manejo de reglas de flujo y graficar la topologia, y se añade la aplicación que se seleccione.
 