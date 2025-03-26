
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


# 📌 Página para ver, editar, agregar productos, editar productos y eliminar productos de una recepción específica
@recepciones_bp.route('/recepcion/editar/<int:recepcion_id>')
@login_required
def editar_recepcion(recepcion_id):
    recepcion = Recepcion.query.get(recepcion_id)

    if not recepcion:
        return jsonify({"error": "⚠️ Recepción no encontrada"}), 404

    # Obtener los productos asociados a la recepción
    productos_asociados = Producto.query.filter_by(recepcion_id=recepcion.id).all()

    return render_template(
        'recepcion_editar.html',
        recepcion_id=recepcion.id,
        fecha=recepcion.fecha,
        subproceso=recepcion.subproceso,
        proveedor=recepcion.proveedor,
        link_FR=recepcion.link_FR,
        productos=productos_asociados  # Pasamos los productos a la plantilla
    )

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
        "codigo_proveedor": producto_base.codigo_proveedor,
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
# Ruta para escanear
@recepciones_bp.route('/escanear', methods=['POST'])
@login_required
def escanear():
    data = request.json
    codigo = data.get("codigo")
    recepcion_id = data.get("recepcion_id")  # 🚨 Nueva referencia

    if not recepcion_id:
        return jsonify({"error": "⚠️ La recepción es obligatoria"}), 400

    print(f"🔍 Código recibido en backend para búsqueda: {codigo}")

    producto_base = ProductoBase.query.filter_by(codigo_base=codigo).first()

    if not producto_base:
        return jsonify({"error": "⚠️ Producto no registrado en la base de datos"}), 400

    print(f"✅ Producto encontrado: {producto_base.ins_mat_prod}")

    # 📌 Generar el número de partida
    nueva_partida = generar_nueva_partida(producto_base.cat_partida)

    # Crear nuevo producto con datos de la recepción
    nuevo_producto = Producto(
        codigo=codigo,
        codigo_tango=producto_base.codigo_tango,
        ins_mat_prod=producto_base.ins_mat_prod,
        codigo_proveedor=producto_base.codigo_proveedor,
        proveedor=producto_base.proveedor,
        nro_lote=data.get("nro_lote"),
        fecha_vto=data.get("fecha_vto"),
        temperatura=data.get("temperatura"),
        cantidad_ingresada=data.get("cantidad_ingresada"),
        nro_partida_asignada=nueva_partida,
        codigo_base=producto_base.codigo_base,  # Relación con ProductoBase
        recepcion_id=recepcion_id  # Se asocia a la recepción existente
    )

    db.session.add(nuevo_producto)
    db.session.commit()

    return jsonify({
        "mensaje": "✅ Producto registrado exitosamente",
        "producto_id": nuevo_producto.id,
        "codigo": nuevo_producto.codigo,
        "codigo_tango": nuevo_producto.codigo_tango,
        "ins_mat_prod": nuevo_producto.ins_mat_prod,
        "codigo_proveedor": nuevo_producto.codigo_proveedor,
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
        "codigo_tango": p.codigo_tango,
        "ins_mat_prod": p.ins_mat_prod,
        "codigo_proveedor": p.codigo_proveedor,
        "proveedor": p.proveedor,
        "nro_lote": p.nro_lote,
        "fecha_vto": str(p.fecha_vto),
        "temperatura": p.temperatura,
        "cantidad_ingresada": p.cantidad_ingresada,
        "nro_partida_asignada": p.nro_partida_asignada,
        "recepciones": [r.id for r in p.recepciones]  # ✅ IDs de las recepciones en las que está el producto
    } for p in productos]

    return jsonify(productos_json)
# Ruta para crear una recepcion y luego agregarle productos escaneados
@recepciones_bp.route('/crear-recepcion', methods=['POST'])
@login_required
def crear_recepcion():
    try:
        data = request.json
        subproceso = data.get("subproceso")
        codigo_proveedor = data.get("codigo_proveedor")
        proveedor = data.get("proveedor")
        link_FR = data.get("link_FR")

        if not subproceso or not proveedor or not codigo_proveedor or not link_FR:
            return jsonify({"error": "⚠️ Complete todos los campos"}), 400

        nueva_recepcion = Recepcion(
            subproceso=subproceso,
            codigo_proveedor=codigo_proveedor,
            proveedor=proveedor,
            link_FR=link_FR
        )
        db.session.add(nueva_recepcion)
        db.session.commit()

        return jsonify({"mensaje": "✅ Recepción creada exitosamente", "recepcion_id": nueva_recepcion.id})

    except Exception as e:
        print(f"❌ Error en crear_recepcion: {e}")
        return jsonify({"error": "❌ Error en el servidor"}), 500

# 📌 Ruta para obtener todas las recepciones con sus productos
@recepciones_bp.route('/recepciones', methods=['GET'])
@login_required
def obtener_recepciones():
    recepciones = Recepcion.query.all()

    recepciones_json = [{
        "id": r.id,
        "fecha": str(r.fecha),
        "subproceso": r.subproceso,
        "codigo_proveedor": r.codigo_proveedor,
        "proveedor": r.proveedor,
        "productos": [{
            "codigo": p.codigo,
            "codigo_tango": p.codigo_tango,
            "ins_mat_prod": p.ins_mat_prod,
            "codigo_proveedor": p.codigo_proveedor,
            "proveedor": p.proveedor,
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
        print(f"🔹 {producto.codigo} - {producto.nro_partida_asignada} - {producto.ins_mat_prod} - {producto.nro_lote}")

    recepcion_json = {
        "id": recepcion.id,
        "fecha": str(recepcion.fecha),
        "subproceso": recepcion.subproceso,
        "codigo_proveedor": recepcion.codigo_proveedor,
        "proveedor": recepcion.proveedor,
        "link_FR": recepcion.link_FR,
        "productos": [{
            "codigo": p.codigo,
            "codigo_tango": p.codigo_tango,
            "ins_mat_prod": p.ins_mat_prod,
            "codigo_proveedor": p.codigo_proveedor,
            "proveedor": p.proveedor,
            "nro_lote": p.nro_lote,
            "fecha_vto": str(p.fecha_vto),
            "temperatura": p.temperatura,
            "cantidad_ingresada": p.cantidad_ingresada,
            "nro_partida_asignada": p.nro_partida_asignada
        } for p in productos_asociados]  # ✅ Los productos vienen de la relación con `recepcion_id`
    }

    return jsonify(recepcion_json)

# 📌 Ruta para agregar un producto a una recepción
@recepciones_bp.route('/recepcion/<int:recepcion_id>/agregar-producto', methods=['POST'])
@login_required
def agregar_producto_a_recepcion(recepcion_id):
    data = request.json  # Asegurarse de recibir JSON correctamente

    if not data:
        return jsonify({"error": "⚠️ No se recibieron datos"}), 400

    codigo = data.get("codigo")
    if not codigo:
        return jsonify({"error": "⚠️ El código del producto es obligatorio"}), 400

    recepcion = Recepcion.query.get(recepcion_id)
    if not recepcion:
        return jsonify({"error": "⚠️ Recepción no encontrada"}), 404

    # Buscar si el producto existe en la base de datos
    producto_base = ProductoBase.query.filter_by(codigo_base=codigo).first()
    if not producto_base:
        return jsonify({"error": "⚠️ Producto no registrado en la base de datos"}), 400

    nueva_partida = f"P-{recepcion_id}-{codigo}"  # Generar partida ficticia

    nuevo_producto = Producto(
        codigo=codigo,
        codigo_tango=producto_base.codigo_tango,
        ins_mat_prod=producto_base.ins_mat_prod,
        codigo_proveedor=producto_base.codigo_proveedor,
        proveedor=producto_base.proveedor,
        nro_lote=data.get("nro_lote"),
        fecha_vto=data.get("fecha_vto"),
        temperatura=data.get("temperatura"),
        cantidad_ingresada=data.get("cantidad_ingresada"),
        nro_partida_asignada=nueva_partida,
        recepcion_id=recepcion_id
    )

    db.session.add(nuevo_producto)
    db.session.commit()

    return jsonify({
        "mensaje": "✅ Producto agregado exitosamente",
        "id": nuevo_producto.id,
        "codigo": nuevo_producto.codigo,
        "codigo_tango": nuevo_producto.codigo_tango,
        "ins_mat_prod": nuevo_producto.ins_mat_prod,
        "codigo_tango": nuevo_producto.codigo_proveedor,
        "proveedor": nuevo_producto.proveedor,
        "nro_lote": nuevo_producto.nro_lote,
        "fecha_vto": nuevo_producto.fecha_vto,
        "temperatura": nuevo_producto.temperatura,
        "cantidad_ingresada": nuevo_producto.cantidad_ingresada,
        "nro_partida_asignada": nuevo_producto.nro_partida_asignada,
    })


@recepciones_bp.route('/eliminar-producto/<int:producto_id>', methods=['DELETE'])
@login_required
def eliminar_producto(producto_id):
    producto = Producto.query.get(producto_id)

    if not producto:
        return jsonify({"error": "⚠️ Producto no encontrado"}), 404

    # 📌 Guardar detalles del producto eliminado para el registro
    producto_eliminado = {
        "codigo": producto.codigo,
        "ins_mat_prod": producto.ins_mat_prod,
        "nro_partida_asignada": producto.nro_partida_asignada
    }

    # 📌 Eliminar el producto de la base de datos
    db.session.delete(producto)
    db.session.commit()

    # Imprimir para depurar
    print(f"Producto eliminado: {producto_eliminado}")

    # Devolver respuesta con el producto eliminado
    return jsonify({
        "mensaje": "✅ Producto eliminado correctamente",
        "producto_eliminado": producto_eliminado
    })
