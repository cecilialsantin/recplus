from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

automatizacion_bp = Blueprint('automatizacion', __name__, url_prefix='/automatizacion')

# 📌 Ruta para la página de automatización
@automatizacion_bp.route('/')
@login_required
def automatizacion():
    return render_template('automatizacion.html')

# 📌 Ruta para iniciar Selenium y completar el formulario en Loyal
@automatizacion_bp.route('/iniciarSelenium', methods=['POST'])
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

        # 🔹 Esperar a que el usuario inicie sesión (60 segundos máx.)
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
