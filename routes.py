import datetime
from flask import request, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from config import app, db
from models import Usuario, Producto, Recepcion
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


# 📌 Ruta para registrar un producto escaneado
@app.route('/escanear', methods=['POST'])
@login_required
def escanear():
    data = request.json
    codigo = data.get("codigo")
    nro_lote = data.get("nro_lote")
    fecha_vto_str = data.get("fecha_vto")
    temperatura = data.get("temperatura")
    cantidad_ingresada = data.get("cantidad_ingresada")
    nro_partida_asignada = data.get("nro_partida_asignada")

    # 🔹 Convertir la fecha a formato `datetime.date`
    try:
        fecha_vto = datetime.strptime(fecha_vto_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "⚠️ Formato de fecha inválido. Use YYYY-MM-DD"}), 400

    # 🔹 Verificar si el mismo código y lote ya están registrados
    if Producto.query.filter_by(codigo=codigo, nro_lote=nro_lote).first():
        return jsonify({"error": "⚠️ Este producto con el mismo lote ya está registrado"}), 400

    # 🔹 Crear el nuevo producto
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


# 📌 Ruta para registrar una recepción con varios productos
@app.route('/recepcion', methods=['POST'])
@login_required
def registrar_recepcion():
    data = request.json
    subproceso = data.get("subproceso")
    proveedor = data.get("proveedor")
    ins_mat_prod = data.get("ins_mat_prod")
    productos_codigos = data.get("productos")  # Lista de códigos de productos

    if not productos_codigos or not isinstance(productos_codigos, list):
        return jsonify({"error": "⚠️ Se debe enviar una lista de productos"}), 400

    nueva_recepcion = Recepcion(
        subproceso=subproceso,
        proveedor=proveedor,
        ins_mat_prod=ins_mat_prod
    )

    db.session.add(nueva_recepcion)
    db.session.flush()  # ⚠️ Esto permite usar `nueva_recepcion.id` antes del commit

    # 🔹 Relacionar los productos con la recepción
    for codigo in productos_codigos:
        producto = Producto.query.filter_by(codigo=codigo).first()
        if producto:
            nueva_recepcion.productos.append(producto)  # Relación Muchos a Muchos

    db.session.commit()

    return jsonify({"mensaje": "✅ Recepción registrada correctamente"})


# 📌 Ruta para obtener todas las recepciones con sus productos
@app.route('/recepciones', methods=['GET'])
@login_required
def obtener_recepciones():
    recepciones = Recepcion.query.all()
    
    recepciones_json = []
    for r in recepciones:
        recepcion_info = {
            "id": r.id,
            "fecha": str(r.fecha),
            "subproceso": r.subproceso,
            "proveedor": r.proveedor,
            "ins_mat_prod": r.ins_mat_prod,
            "productos": [{"codigo": p.codigo, "nro_lote": p.nro_lote} for p in r.productos]
        }
        recepciones_json.append(recepcion_info)

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
    productos = Producto.query.join(Recepcion).filter(Recepcion.id == recepcion_id).all()

    # Estructurar la respuesta JSON con todos los detalles
    recepcion_json = {
        "id": recepcion.id,
        "fecha": str(recepcion.fecha),
        "subproceso": recepcion.subproceso,
        "proveedor": recepcion.proveedor,
        "ins_mat_prod": recepcion.ins_mat_prod,
        "productos": [{
            "codigo": p.codigo,
            "nro_lote": p.nro_lote,
            "fecha_vto": str(p.fecha_vto),
            "temperatura": p.temperatura,
            "cantidad_ingresada": p.cantidad_ingresada,
            "nro_partida_asignada": p.nro_partida_asignada
        } for p in productos]
    }

    return jsonify(recepcion_json)

# 📌 Ruta para iniciar Selenium y completar el formulario en Loyal
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

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

