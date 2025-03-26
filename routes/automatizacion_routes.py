import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request, render_template
from models import Producto, Recepcion, db

load_dotenv()  # Cargar variables del entorno desde .env

automatizacion_bp = Blueprint('automatizacion', __name__, url_prefix='/automatizacion')

@automatizacion_bp.route('/')
def automatizacion():
    return render_template('automatizacion.html')

def crear_formulario_loyal(producto: dict, recepcion: dict, dry_run=False) -> dict:
    url = os.getenv("LOYAL_API_BASE_URL", "https://felsan.loyal-solutions.com/rest/external/createForm")

    payload = {
        "userName": os.getenv("LOYAL_API_USERNAME"),
        "password": os.getenv("LOYAL_API_PASSWORD"),
        "abstractFormId": int(os.getenv("LOYAL_ABSTRACT_FORM_ID", 7)),
        "formTypeId": int(os.getenv("LOYAL_FORM_TYPE_ID", 66)),
        "authorId": int(os.getenv("LOYAL_AUTHOR_ID", 999)),
        "companyId": int(os.getenv("LOYAL_COMPANY_ID", 1)),
        "title": f"{producto['ins_mat_prod']} - {recepcion['id']}",
        "scopesCodes": [os.getenv("LOYAL_ISSUING_SCOPE_CODE", "RECEPCION")],
        "issuingScopeCode": os.getenv("LOYAL_ISSUING_SCOPE_CODE", "RECEPCION"),
        "key": os.getenv("LOYAL_KEY", "api@example.com"),
    }

    def format_fecha(value):
        if isinstance(value, str):
            return value
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d")
        return str(value)

    referencias = [
        {"referenceID": 158, "values": [format_fecha(recepcion["fecha"])]},
        {"referenceID": 126, "values": [recepcion["subproceso"]]},
        {"referenceID": 110, "values": [producto["codigo_proveedor"]]},
        {"referenceID": 408, "values": [str(producto.get("temperatura", ""))]},
        {"referenceID": 111, "values": [producto["codigo_tango"]]},
        {"referenceID": 143, "values": [str(producto["cantidad_ingresada"])]},
        {"referenceID": 147, "values": [producto["nro_partida_asignada"]]},
        {"referenceID": 115, "values": [producto["nro_lote"]]},
        {"referenceID": 136, "values": [format_fecha(producto["fecha_vto"])]},
    ]

    ref_padre_id = os.getenv("LOYAL_REFERENCE_FORM_PADRE_ID")
    if ref_padre_id and recepcion.get("link_FR"):
        referencias.append({
            "referenceID": int(ref_padre_id),
            "values": [recepcion["link_FR"]]
        })

    payload["reference"] = referencias

    if dry_run:
        print("🔍 [DRY RUN] Payload generado:", payload)
        return {"success": True, "dry_run": True, "payload": payload}

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("success"):
            print("✅ Formulario creado en Loyal:", data)
        else:
            print("⚠️ Error desde Loyal:", data)

        return data

    except requests.RequestException as e:
        print("❌ Error al conectar con API Loyal:", e)
        return {"success": False, "error": str(e)}

@automatizacion_bp.route('/cargarALoyal/<int:recepcion_id>', methods=['POST'])
def cargar_recepcion_a_loyal(recepcion_id):
    recepcion = Recepcion.query.get(recepcion_id)
    if not recepcion:
        return jsonify({"success": False, "error": "⚠️ Recepción no encontrada"}), 404

    productos = Producto.query.filter_by(recepcion_id=recepcion.id).all()
    if not productos:
        return jsonify({"success": False, "error": "⚠️ No hay productos en esta recepción"}), 400

    errores = []
    resultados = []
    dry_run = request.args.get("dry_run", "false").lower() == "true"

    for p in productos:
        producto_dict = {
            "codigo_proveedor": p.codigo_proveedor,
            "codigo_tango": p.codigo_tango,
            "ins_mat_prod": p.ins_mat_prod,
            "temperatura": p.temperatura,
            "cantidad_ingresada": p.cantidad_ingresada,
            "nro_partida_asignada": p.nro_partida_asignada,
            "nro_lote": p.nro_lote,
            "fecha_vto": p.fecha_vto
        }

        recepcion_dict = {
            "id": recepcion.id,
            "fecha": recepcion.fecha,
            "subproceso": recepcion.subproceso,
            "proveedor": recepcion.proveedor,
            "link_FR": recepcion.link_FR
        }

        resultado = crear_formulario_loyal(producto_dict, recepcion_dict, dry_run=dry_run)

        if not resultado.get("success"):
            errores.append(resultado)
        resultados.append(resultado)

    return jsonify({"success": True, "dry_run": dry_run, "resultados": resultados, "errores": errores})

