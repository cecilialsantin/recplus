# **RecPlus**

Sistema de escaneo y automatización de carga en **Loyal QMS** con **Flask, MySQL y una interfaz web en HTML+JS**.

---

## **📌 Descripción del Proyecto**  
RecPlus es una aplicación que permite **automatizar la carga de datos de productos** en **Loyal QMS** a través del escaneo de códigos de barras.  

✅ Escanea productos con un **lector de código de barras Gadnic Inalámbrico 1D/2D/QR**  
✅ Obtiene automáticamente **nombre, lote, fecha de vencimiento y proveedor** desde la base de datos  
✅ Registra cada escaneo en **MySQL** para trazabilidad  
✅ Permite **verificar, simular y confirmar** el envío a **Loyal QMS** usando su **API oficial**

---

## **🛠️ Tecnologías Utilizadas**

📌 **Backend:**  
- **Python + Flask** → API para manejar la lógica del sistema  
- **SQLAlchemy (ORM)** → Manejo de la base de datos en MySQL  
- **dotenv** → Variables de entorno seguras  
- **API REST Loyal** → Envío de datos a través del endpoint proporcionado por LOYAL Solutions para la creacion de formularios

📌 **Base de Datos:**  
- **MySQL** → Registro de productos y escaneos  

📌 **Frontend:**  
- **HTML + JavaScript (Fetch API)** → Interfaz interactiva en tiempo real  
- **CSS personalizado** → Para estilizar la aplicación

---

## **📂 Cómo ejecutar el proyecto localmente**

```bash
# 1. Clonar el repositorio
git clone https://github.com/usuario/recplus.git
cd recplus

# 2. Crear entorno virtual
python3 -m venv env
source env/bin/activate  # En Windows: env\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar el archivo .env
cp .env.example .env
# 👉 Completar las variables: DB, LOYAL_API_URL, LOYAL_USERNAME, LOYAL_PASSWORD

# 5. Ejecutar la app
python3 app.py
```

---

## **📌 API - Endpoints**

### Buscar un Producto Escaneado  
```http
GET /escanear?codigo=1234567890123
```

### Ejemplo de Respuesta JSON  
```json
{
  "codigo": "1234567890123",
  "nombre": "Producto Test",
  "lote": "L123",
  "fecha_vencimiento": "2030-01-01",
  "proveedor": "Proveedor SRL",
  "mensaje": "✅ Producto encontrado y escaneo registrado."
}
```

### Si el producto no existe:  
```json
{
  "error": "⚠️ Producto no encontrado en la base de datos."
}
```

---

## **📌 Próximos Pasos**

✅ Finalizar integración con API de Loyal  
✅ Probar envío completo de formularios  
🟡 Crear historial de envíos visual en interfaz  
🟡 Mejorar manejo de errores visuales y logs

---

## **📜 Licencia**

📌 Proyecto desarrollado por **Cecilia Santin** para la gestión de productos en **Loyal QMS**.  
📌 Código abierto bajo la **licencia MIT**.

---