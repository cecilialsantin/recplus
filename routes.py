import datetime
from flask import request, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from config import app, db
from models import ProductoBase, Usuario, Producto, Recepcion
from flask import render_template
from selenium import webdriver  # 🔹 Asegúrate de importar esto
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
import time

# 📌 Ruta para verificar que el backend está funcionando
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"mensaje": "✅ API funcionando correctamente"})

# 📌 Ruta para la página principal (Login)
@app.route('/')
def index():
    return render_template('index.html')

# 📌 Ruta para la página de Home (Después del Login)
@app.route('/home')
@login_required
def home():
    return render_template('home.html')

@app.route('/automatizacion')
@login_required
def automatizacion():
    return render_template('automatizacion.html')

@app.route('/recepciones-listado')
@login_required
def recepciones_listado():
    return render_template('recepciones.html')

# 📌 Ruta para registrar nuevos usuarios (Solo el Admin puede hacerlo)
@app.route('/register', methods=['POST'])
@login_required
def register():
    # Solo el admin puede registrar usuarios
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Solo el admin puede registrar nuevos usuarios."}), 403

    data = request.json
    username = data.get("username")
    password = data.get("password")
    rol = data.get("rol")  # Puede ser "deposito" o "garantia"

    if not rol or rol not in ["deposito", "garantia"]:
        return jsonify({"error": "⚠️ El rol debe ser 'deposito' o 'garantia'"}), 400

    if Usuario.query.filter_by(username=username).first():
        return jsonify({"error": "⚠️ Este usuario ya existe."}), 400

    nuevo_usuario = Usuario(username=username, rol=rol)
    nuevo_usuario.set_password(password)

    db.session.add(nuevo_usuario)
    db.session.commit()

    return jsonify({"mensaje": "✅ Usuario registrado exitosamente", "usuario": username, "rol": rol})

# 📌 Ruta para iniciar sesión
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    # Buscar usuario por username
    usuario = Usuario.query.filter_by(username=username).first()

    if not usuario:
        return jsonify({"error": "⚠️ Usuario incorrecto"}), 403

    if not usuario.check_password(password):
        return jsonify({"error": "⚠️ Contraseña incorrecta"}), 401

    login_user(usuario)

    return jsonify({
        "mensaje": "✅ Login exitoso",
        "usuario": usuario.username,
        "rol": usuario.rol  # ✅ Agregar el rol del usuario en la respuesta
    })


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

# 📌 Ruta para cargar productos base en la base de datos
@app.route('/cargar-productos-base', methods=['POST'])
#@login_required
def cargar_productos_base():
    data = request.json

    if not isinstance(data, list):
        return jsonify({"error": "⚠️ Debe enviarse una lista de productos"}), 400

    productos_creados = []

    try:
        for producto in data:
            codigo_base = producto.get("codigo_base")
            codigo_tango = producto.get("codigo_tango")
            ins_mat_prod = producto.get("ins_mat_prod")
            proveedor = producto.get("proveedor")

            if not codigo_base or not codigo_tango or not ins_mat_prod or not proveedor:
                return jsonify({"error": f"⚠️ Datos incompletos en producto {codigo_base}"}), 400

            # Verificar si el producto ya existe en la base
            producto_existente = ProductoBase.query.filter_by(codigo_base=codigo_base).first()
            if producto_existente:
                continue  # Si ya existe, lo ignoramos

            # Crear el nuevo producto base
            nuevo_producto = ProductoBase(
                codigo_base=codigo_base,
                codigo_tango=codigo_tango,
                ins_mat_prod=ins_mat_prod,
                proveedor=proveedor
            )

            db.session.add(nuevo_producto)
            productos_creados.append(codigo_base)

        db.session.commit()
        return jsonify({"mensaje": "✅ Productos base cargados correctamente", "productos": productos_creados})

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"❌ Error al cargar los productos base: {str(e)}"}), 500


# 📌 Ruta para obtener los datos de un producto en ProductoBase
@app.route('/producto-base/<string:codigo>', methods=['GET'])
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
@app.route('/escanear', methods=['POST'])
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
@app.route('/productos', methods=['GET'])
@login_required
def obtener_productos():
    productos = Producto.query.all()
    
    productos_json = [{
        "codigo": p.codigo,
        "ins_mat_prod": p.ins_mat_prod,  # ✅ Ahora se incluye este campo
        "nro_lote": p.nro_lote,
        "fecha_vto": str(p.fecha_vto),
        "temperatura": p.temperatura,
        "cantidad_ingresada": p.cantidad_ingresada,
        "nro_partida_asignada": p.nro_partida_asignada,
        "recepciones": [r.id for r in p.recepciones]  # ✅ IDs de las recepciones en las que está el producto
    } for p in productos]

    return jsonify(productos_json)


# 📌 Ruta para registrar una recepción con varios productos
@app.route('/recepcion', methods=['POST'])
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

    # 🔹 Relacionar los productos escaneados con la recepción
    for codigo in productos_codigos:
        producto = Producto.query.filter_by(codigo=codigo).first()
        if producto:
            nueva_recepcion.productos.append(producto)

    db.session.commit()

    return jsonify({"mensaje": "✅ Recepción registrada correctamente", "id": nueva_recepcion.id})



# 📌 Ruta para obtener todas las recepciones con sus productos
@app.route('/recepciones', methods=['GET'])
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
        } for p in r.productos]
    } for r in recepciones]

    return jsonify(recepciones_json)

# 📌 Ruta para obtener una recepción con todos sus productos y detalles
@app.route('/recepcion/<int:recepcion_id>', methods=['GET'])
@login_required
def obtener_recepcion_con_productos(recepcion_id):
    # Buscar la recepción en la base de datos
    recepcion = Recepcion.query.get(recepcion_id)
    
    if not recepcion:
        return jsonify({"error": "⚠️ Recepción no encontrada"}), 404
    
    # Obtener todos los productos relacionados con la recepción
    productos = recepcion.productos  # Ahora se obtiene directamente desde la relación muchos a muchos

    # Estructurar la respuesta JSON con todos los detalles
    recepcion_json = {
        "id": recepcion.id,
        "fecha": str(recepcion.fecha),
        "subproceso": recepcion.subproceso,
        "proveedor": recepcion.proveedor,
        "productos": [{
            "codigo": p.codigo,
            "ins_mat_prod": p.ins_mat_prod,  # ✅ Ahora se incluye este campo
            "nro_lote": p.nro_lote,
            "fecha_vto": str(p.fecha_vto),
            "temperatura": p.temperatura,
            "cantidad_ingresada": p.cantidad_ingresada,
            "nro_partida_asignada": p.nro_partida_asignada
        } for p in productos]
    }

    return jsonify(recepcion_json)


# 📌 Ruta para iniciar Selenium y completar el formulario en Loyal

@app.route('/iniciarSelenium', methods=['POST'])
@login_required
def iniciar_selenium():
    data = request.json
    codigo_formulario = data.get("codigo")

    if not codigo_formulario:
        return jsonify({"error": "⚠️ Debe ingresar un código de formulario"}), 400

    try:
        # 🔹 Configurar Selenium con Chrome
        options = webdriver.ChromeOptions()
        driver = webdriver.Chrome(options=options)

        # 🔹 Abrir Loyal (te deja en la pantalla de login)
        driver.get("https://loyal-solutions.com/")
        print("🔹 Inicia sesión en Loyal manualmente...")

        # 🔹 Esperar a que el usuario inicie sesión (30 segundos máx.)
        timeout = 60
        start_time = time.time()

        while time.time() - start_time < timeout:
            try:
                # Verificar si ya está logueado (buscando un elemento de la página principal)
                if driver.find_element(By.XPATH, "//a[contains(text(),'QMS')]"):
                    print("✅ Sesión iniciada en Loyal. Continuando automatización...")
                    break
            except:
                time.sleep(2)  # Esperar un poco antes de volver a verificar
        
        # Si no se detectó el login, cancelar
        else:
            driver.quit()
            return jsonify({"error": "⚠️ No se detectó el inicio de sesión en Loyal"}), 400

        # 🔹 Ir a la sección de QMS
        driver.find_element(By.XPATH, "//a[contains(text(),'QMS')]").click()
        time.sleep(3)

        # 🔹 Buscar el formulario ingresado
        search_box = driver.find_element(By.XPATH, "//input[@placeholder='Buscar Formulario']")
        search_box.send_keys(codigo_formulario)
        search_box.send_keys(Keys.RETURN)
        time.sleep(3)

        # 🔹 Ingresar al formulario
        driver.find_element(By.XPATH, f"//td[contains(text(), '{codigo_formulario}')]").click()
        time.sleep(3)

        # 🔹 Completar la sección "Carga de Mercadería Recibida"
        driver.find_element(By.XPATH, "//button[contains(text(),'Ingresar')]").click()
        time.sleep(2)

        # 🔹 Completar campos (Ejemplo: Subprocesos)
        driver.find_element(By.XPATH, "//input[@placeholder='Subprocesos']").send_keys("Ejemplo de subproceso")

        # 🔹 Guardar y salir
        driver.find_element(By.XPATH, "//button[contains(text(),'Guardar')]").click()
        time.sleep(3)

        driver.quit()
        return jsonify({"mensaje": "✅ Formulario completado exitosamente en Loyal."})

    except Exception as e:
        print("❌ Error en Selenium:", e)
        return jsonify({"error": "❌ Error al completar el formulario"}), 500

