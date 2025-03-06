from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from models import ProductoBase, db

productos_bp = Blueprint('productos', __name__, url_prefix='/admin/productosBase')

# 📌 Ruta para la página de gestión de productos (solo Admin)
@productos_bp.route('')
@login_required
def gestion_productosBase():
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Acceso denegado"}), 403
    return render_template('productosBase.html')

# 📌 Ruta para obtener la lista de productos
@productos_bp.route('/lista', methods=['GET'])
@login_required
def obtener_productosBase():
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Acceso denegado"}), 403

    productos = ProductoBase.query.all()
    productos_json = [{
        "codigo_base": p.codigo_base,
        "codigo_tango": p.codigo_tango,
        "ins_mat_prod": p.ins_mat_prod,
        "proveedor": p.proveedor
    } for p in productos]

    return jsonify(productos_json)

# 📌 Ruta para obtener los datos de un producto base específico
@productos_bp.route('/detalle/<string:codigo_base>', methods=['GET'])
@login_required
def detalle_productoBase(codigo_base):
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Acceso denegado"}), 403

    producto = ProductoBase.query.filter_by(codigo_base=codigo_base).first()
    if not producto:
        return jsonify({"error": "⚠️ Producto no encontrado"}), 404

    return jsonify({
        "codigo_base": producto.codigo_base,
        "codigo_tango": producto.codigo_tango,
        "ins_mat_prod": producto.ins_mat_prod,
        "proveedor": producto.proveedor
    })

# 📌 Ruta para agregar un productoBase
@productos_bp.route('/agregar', methods=['POST'])
@login_required
def agregar_productoBase():
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Acceso denegado"}), 403

    data = request.json
    codigo_base = data.get("codigo_base")
    codigo_tango = data.get("codigo_tango")
    ins_mat_prod = data.get("ins_mat_prod")
    proveedor = data.get("proveedor")

    if not codigo_base or not codigo_tango or not ins_mat_prod or not proveedor:
        return jsonify({"error": "⚠️ Todos los campos son obligatorios"}), 400

    # Verificar si el producto ya existe
    producto_existente = ProductoBase.query.filter_by(codigo_base=codigo_base).first()
    if producto_existente:
        return jsonify({"error": "⚠️ El producto con este código base ya existe"}), 409

    # Crear el nuevo producto
    nuevo_producto = ProductoBase(
        codigo_base=codigo_base,
        codigo_tango=codigo_tango,
        ins_mat_prod=ins_mat_prod,
        proveedor=proveedor
    )
    db.session.add(nuevo_producto)
    db.session.commit()

    return jsonify({"mensaje": "✅ Producto agregado exitosamente"})

# 📌 Ruta para modificar un productoBase
@productos_bp.route('/modificar/<string:codigo_base>', methods=['PUT'])
@login_required
def modificar_productoBase(codigo_base):
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Acceso denegado"}), 403

    producto = ProductoBase.query.filter_by(codigo_base=codigo_base).first()
    if not producto:
        return jsonify({"error": "⚠️ Producto no encontrado"}), 404

    data = request.json
    producto.codigo_tango = data.get("codigo_tango", producto.codigo_tango)
    producto.ins_mat_prod = data.get("ins_mat_prod", producto.ins_mat_prod)
    producto.proveedor = data.get("proveedor", producto.proveedor)
    db.session.commit()

    return jsonify({"mensaje": "✅ Producto actualizado correctamente"})

# 📌 Ruta para eliminar un productoBase
@productos_bp.route('/eliminar/<string:codigo_base>', methods=['DELETE'])
@login_required
def eliminar_productoBase(codigo_base):
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Acceso denegado"}), 403

    producto = ProductoBase.query.filter_by(codigo_base=codigo_base).first()
    if not producto:
        return jsonify({"error": "⚠️ Producto no encontrado"}), 404

    db.session.delete(producto)
    db.session.commit()
    return jsonify({"mensaje": "✅ Producto eliminado exitosamente"})
