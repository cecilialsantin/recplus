import os
import requests
from flask import request
from flask_login import current_user
from dotenv import load_dotenv

load_dotenv()

LOYAL_USERNAME = os.getenv("LOYAL_USERNAME")
LOYAL_PASSWORD = os.getenv("LOYAL_PASSWORD")
LOYAL_API_URL = os.getenv("LOYAL_API_URL")

# Mapeo de usuario RecPlus → authorId Loyal
author_map = {
    "gbolanos": 22,
    "jespiga": 21,
}

def crear_formularios_loyal(recepcion, productos):
    dry_run = request.args.get("dry_run", "true").lower() == "true"
    author_id = author_map.get(current_user.username)
    if not author_id:
        raise ValueError(f"Usuario {current_user.username} no tiene authorId asignado.")

    headers = {"Content-Type": "application/json"}
    resultados = []

    for producto in productos:
        payload = {
            "userName": LOYAL_USERNAME,
            "password": LOYAL_PASSWORD,
            "abstractFormId": 7,
            "formTypeId": 66,
            "code": "",
            "authorId": author_id,
            "companyId": 1,
            "title": f"{producto.ins_mat_prod} - {recepcion.id}",
            "scopesCodes": ["RECEPCION"],
            "issuingScopeCode": "RECEPCION",
            "reference": [
                {"referenceID": 158, "values": [str(recepcion.fecha)]},
                {"referenceID": 126, "values": [recepcion.subproceso]},
                {"referenceID": 110, "values": [recepcion.codigo_proveedor]},
                {"referenceID": 408, "values": [str(producto.temperatura)]},
                {"referenceID": 111, "values": [producto.codigo_tango]},
                {"referenceID": 143, "values": [str(producto.cantidad_ingresada)]},
                {"referenceID": 147, "values": [producto.nro_partida_asignada]},
                {"referenceID": 115, "values": [producto.nro_lote]},
                {"referenceID": 136, "values": [str(producto.fecha_vto)]},
                {"referenceID": 419, "values": [recepcion.link_FR]},
            ]
        }

        if dry_run:
            resultados.append({
    "codigo": producto.codigo,
    "ins_mat_prod": producto.ins_mat_prod,
    "nro_partida_asignada": producto.nro_partida_asignada,
    "authorId": author_id,
    "status": "DRY_RUN",
    "payload": payload
})

            #resultados.append({"producto": producto.codigo, "status": "DRY_RUN", "payload": payload})
        else:
            try:
                response = requests.post(LOYAL_API_URL, json=payload, headers=headers)
                if response.ok:
                    resultados.append({"producto": producto.codigo, "status": "CREADO", "respuesta": response.json()})
                else:
                    resultados.append({"producto": producto.codigo, "status": "ERROR", "detalle": response.text})
            except Exception as e:
                resultados.append({"producto": producto.codigo, "status": "EXCEPTION", "detalle": str(e)})

    return resultados
