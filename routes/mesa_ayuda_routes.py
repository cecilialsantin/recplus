# routes/mesa_ayuda_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required
from utils.chat_parser import parsear_chat_loyal


mesa_ayuda_bp = Blueprint('mesa_ayuda', __name__, url_prefix="/mesa-ayuda")

@mesa_ayuda_bp.route("/procesar-chat", methods=["POST"])
@login_required
def procesar_chat():
    archivo = request.files.get("chat_file")
    if not archivo or not archivo.filename.endswith(".txt"):
        return jsonify({"error": "Archivo inválido"}), 400

    contenido = archivo.read().decode("utf-8")
    resultado = parsear_chat_loyal(contenido)

    if "error" in resultado:
        return jsonify({"error": resultado["error"]}), 400

    return jsonify(resultado)
