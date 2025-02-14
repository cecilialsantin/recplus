from flask import request, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from config import app, db
from models import Usuario, Producto, Recepcion

# 📌 Ruta para verificar que el backend está funcionando
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"mensaje": "✅ API funcionando correctamente"})


# 📌 Ruta para registrar un nuevo usuario (solo para pruebas iniciales)
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if Usuario.query.filter_by(username=username).first():
        return jsonify({"error": "⚠️ El usuario ya existe."}), 400

    nuevo_usuario = Usuario(username=username)
    nuevo_usuario.set_password(password)

    db.session.add(nuevo_usuario)
    db.session.commit()

    return jsonify({"mensaje": "✅ Usuario registrado exitosamente"})


# 📌 Ruta para iniciar sesión
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    usuario = Usuario.query.filter_by(username=username).first()

    if usuario and usuario.check_password(password):
        login_user(usuario)
        return jsonify({"mensaje": "✅ Login exitoso", "usuario": usuario.username})

    return jsonify({"error": "⚠️ Usuario o contraseña incorrectos"}), 401


# 📌 Ruta para cerrar sesión
@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"mensaje": "✅ Sesión cerrada correctamente"})


# 📌 Ruta protegida para obtener el perfil del usuario autenticado
@app.route('/perfil', methods=['GET'])
@login_required
def perfil():
    return jsonify({"usuario": current_user.username})


# 📌 Ruta para registrar un producto escaneado
@app.route('/escanear', methods=['POST'])
@login_required
def escanear():
    data = request.json
    codigo = data.get("codigo")
    nro_lote = data.get("nro_lote")
    fecha_vto = data.get("fecha_vto")
    temperatura = data.get("temperatura")
    cantidad_ingresada = data.get("cantidad_ingresada")
    nro_partida_asignada = data.get("nro_partida_asignada")

    if Producto.query.filter_by(codigo=codigo).first():
        return jsonify({"error": "⚠️ El producto ya está registrado"}), 400

    nuevo_producto = Producto(
        codigo=codigo,
        nro_lote=nro_lote,
        fecha_vto=fecha_vto,
        temperatura=temperatura,
        cantidad_ingresada=cantidad_ingresada,
        nro_partida_asignada=nro_partida_asignada
    )

    db.session.add(nuevo_producto)
    db.session.commit()

    return jsonify({"mensaje": "✅ Producto registrado exitosamente"})


# 📌 Ruta para obtener todos los productos escaneados
@app.route('/productos', methods=['GET'])
@login_required
def obtener_productos():
    productos = Producto.query.all()
    productos_json = [{
        "codigo": p.codigo,
        "nro_lote": p.nro_lote,
        "fecha_vto": str(p.fecha_vto),
        "temperatura": p.temperatura,
        "cantidad_ingresada": p.cantidad_ingresada,
        "nro_partida_asignada": p.nro_partida_asignada
    } for p in productos]

    return jsonify(productos_json)


# 📌 Ruta para registrar una recepción
@app.route('/recepcion', methods=['POST'])
@login_required
def registrar_recepcion():
    data = request.json
    subproceso = data.get("subproceso")
    proveedor = data.get("proveedor")
    ins_mat_prod = data.get("ins_mat_prod")
    producto_codigo = data.get("producto_codigo")

    if not Producto.query.filter_by(codigo=producto_codigo).first():
        return jsonify({"error": "⚠️ El producto no existe"}), 400

    nueva_recepcion = Recepcion(
        subproceso=subproceso,
        proveedor=proveedor,
        ins_mat_prod=ins_mat_prod,
        producto_codigo=producto_codigo
    )

    db.session.add(nueva_recepcion)
    db.session.commit()

    return jsonify({"mensaje": "✅ Recepción registrada correctamente"})


# 📌 Ruta para obtener todas las recepciones
@app.route('/recepciones', methods=['GET'])
@login_required
def obtener_recepciones():
    recepciones = Recepcion.query.all()
    recepciones_json = [{
        "id": r.id,
        "fecha": str(r.fecha),
        "subproceso": r.subproceso,
        "proveedor": r.proveedor,
        "ins_mat_prod": r.ins_mat_prod,
        "producto_codigo": r.producto_codigo
    } for r in recepciones]

    return jsonify(recepciones_json)
