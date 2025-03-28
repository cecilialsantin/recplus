from dotenv import load_dotenv
from flask import Blueprint, jsonify, render_template
from models import Producto, Recepcion
from flask_login import login_required
from crear_formularios_loyal import crear_formularios_loyal

load_dotenv()  # Cargar variables del entorno desde .env

automatizacion_bp = Blueprint('automatizacion', __name__, url_prefix='/automatizacion')

@automatizacion_bp.route('/')
def automatizacion():
    return render_template('automatizacion.html')

# 📌 Ruta para procesar una recepción y enviar formularios a Loyal
@automatizacion_bp.route('/enviar-loyal/<int:recepcion_id>', methods=['POST'])
@login_required
def enviar_a_loyal(recepcion_id):
    recepcion = Recepcion.query.get_or_404(recepcion_id)
    productos = Producto.query.filter_by(recepcion_id=recepcion.id).all()

    if not productos:
        return jsonify({"error": "⚠️ La recepción no tiene productos asociados."}), 400

    try:
        resultados = crear_formularios_loyal(recepcion, productos)
        return jsonify({"recepcion_id": recepcion.id, "resultados": resultados})
    except Exception as e:
        return jsonify({"error": f"❌ Error al procesar los formularios: {str(e)}"})