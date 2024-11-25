from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import requests
import subprocess
import os
app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todas las URLs de origen
    allow_methods=["*"],  # Permitir todos los métodos HTTP
    allow_headers=["*"],  # Permitir todos los headers
)

# RYU_CONTROLLER = "http://10.132.58.186:8080"
RYU_CONTROLLER = "http://192.168.18.59:8080"
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
 
# Aplicaciones Ryu

from pydantic import BaseModel

# Modelo para validar el cuerpo de la solicitud
class RyuAppRequest(BaseModel):
    app_name: str
    
@app.post("/run_ryu_app") 
async def run_ryu_app(request: RyuAppRequest):
    """
    Recibe el nombre de una aplicación de Ryu y la ejecuta usando ryu-manager.
    """
    app_name = request.app_name
    try:
        # Ejecutar la aplicación Ryu usando subprocess
        result = subprocess.run(
            ["ryu-manager", app_name],
            capture_output=True,
            text=True,
            check=True
        )

        return {"message": f"Aplicación {app_name} ejecutada correctamente", 
                "output": result.stdout}

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Error al ejecutar la aplicación: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))