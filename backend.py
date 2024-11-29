# Este backend debe estar en el ryu server y ejecutarse en esa maquina virtual

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import subprocess
import os
from pydantic import BaseModel

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todas las URLs de origen
    allow_methods=["*"],  # Permitir todos los métodos HTTP
    allow_headers=["*"],  # Permitir todos los headers
)

RYU_CONTROLLER = "http://10.132.58.38:8080"
# RYU_CONTROLLER = "http://192.168.18.66:8080"
RYU_BASE_PATH = "/usr/lib/python3/dist-packages/ryu/app/"

# Endpoint para añadir flujos
@app.post("/add_flow") 
def add_flow(flow: dict):
    """
    Recibe los datos de un flujo y lo envía al controlador Ryu.
    """
    try:
        # Enviar solicitud al controlador Ryu
        response = requests.post(f"{RYU_CONTROLLER}/stats/flowentry/add", json=flow)
        
        if response.status_code == 200:
            return {"message": "Flujo agregado exitosamente"}
        else:
            raise HTTPException(status_code=response.status_code, detail="Error en el controlador Ryu")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint para listar flujos
@app.get("/list_flows/{dpid}")
def list_flows(dpid: int):
    try:
        response = requests.get(f"{RYU_CONTROLLER}/stats/flow/{dpid}")
        if response.status_code == 200:
            return response.json()[str(dpid)]
        else:
            raise HTTPException(status_code=response.status_code, detail="Error al obtener los flujos")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint para eliminar flujo
@app.post("/delete_flow")
def delete_flow(flow: dict):
    try:
        flow_entry = {
            "dpid": flow["dpid"],
            "cookie": flow["cookie"],
            "cookie_mask": 0xffffffffffffffff,  # Máscara de coincidencia total para la cookie
            "priority": 1,  # Prioridad predeterminada (o ajusta según sea necesario)
        }
        response = requests.post(f"{RYU_CONTROLLER}/stats/flowentry/delete", json=flow_entry)
        if response.status_code == 200:
            return {"message": "Flujo eliminado exitosamente"}
        else:
            raise HTTPException(status_code=response.status_code, detail="Error al eliminar el flujo")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
# Endpoint para ejecutar aplicaciones Ryu
class RyuAppRequest(BaseModel):
    app_name: str

@app.post("/run_ryu_app")
def run_ryu_app(request: RyuAppRequest):
    app_name = request.app_name  # Accede al campo de manera segura
    """
    Ejecuta una aplicación en Ryu junto con ofctl_rest.
    """
    try:
        if not app_name:
            raise HTTPException(status_code=400, detail="El nombre de la aplicación es obligatorio.")

        # Verifica si la aplicación existe
        app_path = os.path.join(RYU_BASE_PATH, f"{app_name}.py")
        if not os.path.exists(app_path):
            raise HTTPException(status_code=404, detail=f"La aplicación '{app_name}' no existe en {RYU_BASE_PATH}")

        # Construye el comando para ejecutar ryu-manager con ofctl_rest y la aplicación solicitada simultaneamente
        command = f"ryu-manager ryu.app.ofctl_rest ryu.app.{app_name}"

        # Reinicia cualquier instancia previa de ryu-manager
        subprocess.run(["pkill", "-f", "ryu-manager"], check=False)

        # Ejecuta ryu-manager con las aplicaciones necesarias
        subprocess.Popen(command, shell=True)

        return {"message": f"La aplicación '{app_name}' fue iniciada exitosamente junto con ofctl_rest."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



