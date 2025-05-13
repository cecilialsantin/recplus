import os
import requests
import json
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
            "code": "***",
            "authorId": author_id,
            "companyId": 1,
            "title": f"RecPlus - {producto.ins_mat_prod} - {recepcion.id}",
            "scopesCodes": ["REC"],
            "issuingScopeCode": "REC",
            "key": "deposito@felsan.com.ar",
            "references": [
                {"referenceId": 158, "values": [str(recepcion.fecha)]},
                {"referenceId": 126, "values": [recepcion.subproceso]},
                {"referenceId": 110, "values": [recepcion.codigo_proveedor]},
                {"referenceId": 408, "values": [str(producto.temperatura)]},
                {"referenceId": 111, "values": [producto.codigo_tango]},
                {"referenceId": 143, "values": [str(producto.cantidad_ingresada)]},
                {"referenceId": 147, "values": [producto.nro_partida_asignada]},
                {"referenceId": 115, "values": [producto.nro_lote]},
                {"referenceId": 136, "values": [str(producto.fecha_vto)]},
                {"referenceId": 419, "values": [recepcion.link_FR]},
            ]
        }

        if dry_run:
            print("\n📦 PRE-ENVÍO JSON →")
            print(json.dumps(payload, indent=2, ensure_ascii=False))
            resultados.append({
                "codigo": producto.codigo,
                "ins_mat_prod": producto.ins_mat_prod,
                "nro_partida_asignada": producto.nro_partida_asignada,
                "authorId": author_id,
                "status": "DRY_RUN",
                "payload": payload
            })
        else:
            try:
                response = requests.post(LOYAL_API_URL, json=payload, headers=headers)
                if response.ok:
                    try:
                        resultados.append({
                            "producto": producto.codigo,
                            "status": "CREADO",
                            "codigo": producto.codigo,
                            "ins_mat_prod": producto.ins_mat_prod,
                            "nro_partida_asignada": producto.nro_partida_asignada,                            
                            "respuesta": response.json()
                        })
                    except ValueError:
                        resultados.append({
                            "producto": producto.codigo,
                            "status": "ERROR",
                            "detalle": f"Respuesta no JSON: {response.text}"
                        })
                else:
                    resultados.append({
                        "producto": producto.codigo,
                        "status": "ERROR",
                        "detalle": response.text
                    })
            except Exception as e:
                resultados.append({
                    "producto": producto.codigo,
                    "status": "EXCEPTION",
                    "detalle": str(e)
                })

    return resultados
