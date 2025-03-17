
import re
from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from models import PartidaReferencia, ProductoBase, Producto, Recepcion, db
from datetime import datetime
# Crear el Blueprint
recepciones_bp = Blueprint('recepciones', __name__)

# 📌 Página para ver todas las recepciones
@recepciones_bp.route('/recepciones-listado')
@login_required
def recepciones_listado():
    return render_template('recepciones.html')

# Ruta para obtener la ultima partida
@recepciones_bp.route('/ultima-partida/<string:cat_partida>', methods=['GET'])
@login_required
def obtener_ultima_partida(cat_partida):
    referencia_manual = PartidaReferencia.query.filter_by(cat_partida=cat_partida).first()

    if referencia_manual:
        return jsonify({"ultima_partida": referencia_manual.ultima_partida})

    return jsonify({"ultima_partida": None})  # No hay registro previo

# Ruta para actualizar una partida manualmente
@recepciones_bp.route('/actualizar-partida', methods=['PUT'])
@login_required
def actualizar_partida():
    data = request.json
    cat_partida = data.get("cat_partida")
    nueva_partida = data.get("ultima_partida")

    referencia_manual = PartidaReferencia.query.filter_by(cat_partida=cat_partida).first()

    if referencia_manual:
        referencia_manual.ultima_partida = nueva_partida
        referencia_manual.updated_at = datetime.now()
        db.session.commit()
        return jsonify({"mensaje": "✅ Partida actualizada correctamente"})
    
    return jsonify({"error": "⚠️ No se encontró la partida para actualizar."}), 404

# Ruta para agregar una nueva partida manualmente
@recepciones_bp.route('/agregar-partida', methods=['POST'])
@login_required
def agregar_partida():
    data = request.json
    cat_partida = data.get("cat_partida")
    ultima_partida = data.get("ultima_partida")

    if not cat_partida or not ultima_partida:
        return jsonify({"error": "⚠️ Categoría de partida y última partida son obligatorias."}), 400

    # Verificar que no haya una ya existente para esta categoría
    existente = PartidaReferencia.query.filter_by(cat_partida=cat_partida).first()
    if existente:
        return jsonify({"error": "⚠️ Ya existe una referencia para esta categoría."}), 400

    nueva_referencia = PartidaReferencia(
        cat_partida=cat_partida,
        ultima_partida=ultima_partida,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.session.add(nueva_referencia)
    db.session.commit()

    return jsonify({"mensaje": "✅ Partida agregada correctamente"})


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
        "cat_partida": producto_base.cat_partida,
        "ins_mat_prod": producto_base.ins_mat_prod,
        "proveedor": producto_base.proveedor
    })

#Funcion para generar partidas automaticamente
def generar_nueva_partida(cat_partida):
    """Genera un nuevo número de partida asegurando que se incremente en cada escaneo."""
    
    # 📌 Obtener el año y mes actual en formato AAMM
    fecha_actual = datetime.now().strftime("%y%m")  # Ej: "2503" (Marzo 2025)

    # 1️⃣ Buscar si hay una referencia manual en `partida_referencia`
    referencia_manual = PartidaReferencia.query.filter_by(cat_partida=cat_partida).first()
    
    if referencia_manual and referencia_manual.ultima_partida.startswith(cat_partida + fecha_actual):
        ultima_partida = referencia_manual.ultima_partida  # Tomamos la manual si es válida
    else:
        # 2️⃣ Buscar la última partida generada en la tabla `productos`
        ultima_partida = db.session.query(Producto.nro_partida_asignada)\
            .filter(Producto.nro_partida_asignada.like(f"{cat_partida}{fecha_actual}%"))\
            .order_by(Producto.nro_partida_asignada.desc())\
            .first()

        ultima_partida = ultima_partida[0] if ultima_partida else None

    # 3️⃣ Extraer el número secuencial (últimos 3 dígitos) y calcular el siguiente
    if ultima_partida:
        ultimo_numero = int(ultima_partida[-3:])  # Extraer los últimos 3 dígitos y convertirlos a int
        nuevo_numero = f"{ultimo_numero + 1:03d}"  # Incrementar y formatear con ceros
    else:
        nuevo_numero = "001"  # Si no hay partida previa, comenzar con 001

    # 4️⃣ Construir la nueva partida
    nueva_partida = f"{cat_partida}{fecha_actual}{nuevo_numero}"
    print(f"🆕 Nueva partida generada: {nueva_partida}")

    # 5️⃣ Actualizar `partida_referencia` para que el siguiente escaneo la tome como base
    if referencia_manual:
        referencia_manual.ultima_partida = nueva_partida
    else:
        nueva_referencia = PartidaReferencia(cat_partida=cat_partida, ultima_partida=nueva_partida)
        db.session.add(nueva_referencia)

    db.session.commit()  # ✅ Guardar cambios en la base de datos

    return nueva_partida


""" ruta anterior sin partida asignada automaticamente
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
        "proveedor": nuevo_producto.proveedor,
        "nro_lote": nuevo_producto.nro_lote,
        "fecha_vto": nuevo_producto.fecha_vto,
        "temperatura": nuevo_producto.temperatura,
        "cantidad_ingresada": nuevo_producto.cantidad_ingresada,
        "nro_partida_asignada": nuevo_producto.nro_partida_asignada,
    })
"""

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

    if not producto_base.cat_partida:
        print("⚠️ No se encontró la categoría de partida.")
        return jsonify({"error": "⚠️ No se encontró la categoría de partida."}), 400

    print(f"✅ Producto encontrado: {producto_base.ins_mat_prod}")

    # 🔹 1️⃣ Verificar si hay una referencia manual en `partida_referencia`
    referencia_manual = PartidaReferencia.query.filter_by(cat_partida=producto_base.cat_partida).first()

    if referencia_manual:
        ultima_partida = referencia_manual.ultima_partida
        print(f"📌 Última partida manualmente asignada: {ultima_partida}")
    else:
        # 🔹 2️⃣ Si no hay referencia manual, buscar la última partida en la tabla `productos`
        ultima_partida = (
            db.session.query(Producto.nro_partida_asignada)
            .filter(Producto.nro_partida_asignada.like(f"{producto_base.cat_partida}%"))
            .order_by(Producto.nro_partida_asignada.desc())
            .scalar()
        )
        print(f"📌 Última partida registrada en productos: {ultima_partida if ultima_partida else 'Ninguna'}")

    # 🔹 3️⃣ Generar la nueva partida basada en la última existente
    nueva_partida = generar_nueva_partida(producto_base.cat_partida)

    print(f"✅ Nueva partida generada: {nueva_partida}")

    # 🔹 4️⃣ Crear el nuevo producto con la partida asignada
    nuevo_producto = Producto(
        codigo=codigo,
        codigo_tango=producto_base.codigo_tango,
        ins_mat_prod=producto_base.ins_mat_prod,
        proveedor=producto_base.proveedor,
        nro_lote=data.get("nro_lote"),
        fecha_vto=data.get("fecha_vto"),
        temperatura=data.get("temperatura"),
        cantidad_ingresada=data.get("cantidad_ingresada"),
        nro_partida_asignada=nueva_partida,  # ✅ Se asigna la partida generada
        codigo_base=producto_base.codigo_base  # Relación con ProductoBase
    )

    db.session.add(nuevo_producto)
    db.session.commit()

    return jsonify({
        "mensaje": "✅ Producto registrado exitosamente",
        "codigo": nuevo_producto.codigo,
        "codigo_tango": nuevo_producto.codigo_tango,
        "ins_mat_prod": nuevo_producto.ins_mat_prod,
        "proveedor": nuevo_producto.proveedor,
        "nro_lote": nuevo_producto.nro_lote,
        "fecha_vto": nuevo_producto.fecha_vto,
        "temperatura": nuevo_producto.temperatura,
        "cantidad_ingresada": nuevo_producto.cantidad_ingresada,
        "nro_partida_asignada": nuevo_producto.nro_partida_asignada,
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







