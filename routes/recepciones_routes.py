from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from models import ProductoBase, Producto, Recepcion, db

# Crear el Blueprint
recepciones_bp = Blueprint('recepciones', __name__)

# 📌 Página para ver todas las recepciones
@recepciones_bp.route('/recepciones-listado')
@login_required
def recepciones_listado():
    return render_template('recepciones.html')


# 📌 Ruta para obtener los datos de un producto en ProductoBase fuera de admin
@recepciones_bp.route('/producto-base/<string:codigo>', methods=['GET'])
@login_required
def obtener_producto_base(codigo):
    print(f"🔍 Código recibido en la ruta: '{codigo}' (Longitud: {len(codigo)})")

    # Intento de búsqueda exacta
    producto_base = ProductoBase.query.filter_by(codigo_base=codigo).first()

    if not producto_base:
        print(f"❌ No se encontró con búsqueda exacta: '{codigo}'")
        
        # Intento eliminando espacios en blanco
        codigo_limpiado = codigo.strip()
        print(f"🔍 Intentando con código limpio: '{codigo_limpiado}' (Longitud: {len(codigo_limpiado)})")
        
        producto_base = ProductoBase.query.filter_by(codigo_base=codigo_limpiado).first()

        if not producto_base:
            print(f"⚠️ Aún no se encuentra el producto en la base.")
            return jsonify({"error": "⚠️ Producto no encontrado en la base de datos"}), 404

    print(f"✅ Producto encontrado: {producto_base.ins_mat_prod}")

    return jsonify({
        "codigo_base": producto_base.codigo_base,
        "codigo_tango": producto_base.codigo_tango,
        "ins_mat_prod": producto_base.ins_mat_prod,
        "proveedor": producto_base.proveedor
    })


# 📌 Ruta para escanear un producto y registrarlo
@recepciones_bp.route('/escanear', methods=['POST'])
@login_required
def escanear():
    data = request.json
    codigo = data.get("codigo")

    print(f"🔍 Código recibido en backend para búsqueda: {codigo}")

    producto_base = ProductoBase.query.filter_by(codigo_base=codigo).first()

    if not producto_base:
        print("❌ Producto no encontrado en la base de datos.")  # Depuración
        return jsonify({"error": "⚠️ Producto no registrado en la base de datos"}), 400

    print(f"✅ Producto encontrado: {producto_base.ins_mat_prod}")

    # Crear nuevo producto con datos de la recepción
    nuevo_producto = Producto(
        codigo=codigo,
        codigo_tango=producto_base.codigo_tango,
        ins_mat_prod=producto_base.ins_mat_prod,
        proveedor=producto_base.proveedor,
        nro_lote=data.get("nro_lote"),
        fecha_vto=data.get("fecha_vto"),
        temperatura=data.get("temperatura"),
        cantidad_ingresada=data.get("cantidad_ingresada"),
        nro_partida_asignada=data.get("nro_partida_asignada"),
        codigo_base=producto_base.codigo_base  # Relación con ProductoBase
    )

    db.session.add(nuevo_producto)
    db.session.commit()

    return jsonify({
        "mensaje": "✅ Producto registrado exitosamente",
        "codigo": nuevo_producto.codigo,
        "codigo_tango": nuevo_producto.codigo_tango,
        "ins_mat_prod": nuevo_producto.ins_mat_prod,
        "proveedor": nuevo_producto.proveedor
    })


# 📌 Ruta para obtener todos los productos escaneados y sus recepciones
@recepciones_bp.route('/productos', methods=['GET'])
@login_required
def obtener_productos():
    productos = Producto.query.all()
    
    productos_json = [{
        "codigo": p.codigo,
        "ins_mat_prod": p.ins_mat_prod,
        "nro_lote": p.nro_lote,
        "fecha_vto": str(p.fecha_vto),
        "temperatura": p.temperatura,
        "cantidad_ingresada": p.cantidad_ingresada,
        "nro_partida_asignada": p.nro_partida_asignada,
        "recepciones": [r.id for r in p.recepciones]  # ✅ IDs de las recepciones en las que está el producto
    } for p in productos]

    return jsonify(productos_json)

# 📌 Ruta para registrar una recepción con varios productos
@recepciones_bp.route('/recepcion', methods=['POST'])
@login_required
def registrar_recepcion():
    data = request.json
    subproceso = data.get("subproceso")
    proveedor = data.get("proveedor")
    productos_codigos = data.get("productos")  # Lista de códigos de productos a asociar

    if not productos_codigos or not isinstance(productos_codigos, list):
        return jsonify({"error": "⚠️ Se debe enviar una lista de productos"}), 400

    nueva_recepcion = Recepcion(
        subproceso=subproceso,
        proveedor=proveedor
    )

    db.session.add(nueva_recepcion)
    db.session.flush()  # ⚠️ Permite usar `nueva_recepcion.id` antes del commit

    # ✅ Asignar cada producto a la recepción (sin duplicados)
    for codigo in productos_codigos:
        productos = Producto.query.filter_by(codigo=codigo).all()
        for producto in productos:
            producto.recepcion_id = nueva_recepcion.id  # ✅ Asigna la recepción

    db.session.commit()

    return jsonify({"mensaje": "✅ Recepción registrada correctamente", "id": nueva_recepcion.id})


# 📌 Ruta para obtener todas las recepciones con sus productos
@recepciones_bp.route('/recepciones', methods=['GET'])
@login_required
def obtener_recepciones():
    recepciones = Recepcion.query.all()

    recepciones_json = [{
        "id": r.id,
        "fecha": str(r.fecha),
        "subproceso": r.subproceso,
        "proveedor": r.proveedor,
        "productos": [{
            "codigo": p.codigo,
            "ins_mat_prod": p.ins_mat_prod,
            "nro_lote": p.nro_lote,
            "fecha_vto": str(p.fecha_vto),
            "temperatura": p.temperatura,
            "cantidad_ingresada": p.cantidad_ingresada,
            "nro_partida_asignada": p.nro_partida_asignada
        } for p in Producto.query.filter_by(recepcion_id=r.id).all()]  # 🔹 Traer productos correctamente
    } for r in recepciones]

    return jsonify(recepciones_json)


# 📌 Ruta para obtener una recepcion con sus productos
@recepciones_bp.route('/recepcion/<int:recepcion_id>', methods=['GET'])
@login_required
def obtener_recepcion_con_productos(recepcion_id):
    # 🔍 Buscar la recepción directamente
    recepcion = Recepcion.query.get(recepcion_id)

    if not recepcion:
        return jsonify({"error": "⚠️ Recepción no encontrada"}), 404

    # 🔹 Obtener productos relacionados directamente desde la clave foránea en `productos`
    productos_asociados = Producto.query.filter_by(recepcion_id=recepcion.id).all()

    # ✅ Depuración: Imprimir todos los productos asociados a la recepción
    print(f"📌 Recepción {recepcion.id} encontrada. Productos asociados:")
    for producto in productos_asociados:
        print(f"🔹 {producto.codigo} - {producto.ins_mat_prod} - {producto.nro_lote} - {producto.cantidad_ingresada}")

    recepcion_json = {
        "id": recepcion.id,
        "fecha": str(recepcion.fecha),
        "subproceso": recepcion.subproceso,
        "proveedor": recepcion.proveedor,
        "productos": [{
            "codigo": p.codigo,
            "ins_mat_prod": p.ins_mat_prod,
            "nro_lote": p.nro_lote,
            "fecha_vto": str(p.fecha_vto),
            "temperatura": p.temperatura,
            "cantidad_ingresada": p.cantidad_ingresada,
            "nro_partida_asignada": p.nro_partida_asignada
        } for p in productos_asociados]  # ✅ Los productos vienen de la relación con `recepcion_id`
    }

    return jsonify(recepcion_json)

# Ruta para filtrar proveedores desde productos_base
@recepciones_bp.route('/proveedores', methods=['GET'])
@login_required
def obtener_proveedores():
    proveedores_unicos = db.session.query(ProductoBase.proveedor).distinct().all()
    proveedores_lista = [p[0] for p in proveedores_unicos]  # Extraer los valores únicos

    return jsonify(proveedores_lista)







