**RecPlus**

Sistema de escaneo y automatización de carga en **Loyal QMS** con **Flask, MySQL y una interfaz web en HTML+JS**.

## **📌 Descripción del Proyecto**  
RecPlus es una aplicación que permite **automatizar la carga de datos de productos** en **Loyal QMS** a través del escaneo de códigos de barras.  
✅ Escanea productos con un **lector de código de barras Gadnic Inalámbrico 1D/2D/QR**.  
✅ Obtiene automáticamente **nombre, lote, fecha de vencimiento y proveedor** desde la base de datos.  
✅ Registra cada escaneo en **MySQL** para trazabilidad.  
✅ Permite **verificar y enviar** los datos a Loyal QMS de manera automática.  

---

## **🛠️ Tecnologías Utilizadas**  
📌 **Backend:**  
- **Python + Flask** → API para manejar el escaneo de productos.  
- **SQLAlchemy (ORM)** → Gestión de la base de datos en MySQL.  
- **dotenv** → Variables de entorno para configuración segura.  

📌 **Base de Datos:**  
- **MySQL** → Almacena los productos y el historial de escaneos.  

📌 **Frontend:**  
- **HTML + JavaScript (Fetch API)** → Interfaz para escanear y mostrar datos en tiempo real.  
- **CSS (Opcional)** → Para mejorar el diseño de la interfaz.  

📌 **Automatización Opcional:**  
- **Selenium** → Para automatizar la carga de datos en **Loyal QMS**.  

---

## **📂 Estructura del Proyecto**
```
recplus/
│── envrecplus/          # Entorno virtual (no se sube a Git)
│── app.py               # Archivo principal de Flask
│── config.py            # Configuración de la base de datos y variables de entorno
│── models.py            # Modelos de SQLAlchemy para la base de datos
│── routes.py            # Rutas de la API
│── templates/           # Carpeta para HTML (Frontend)
│   ├── index.html       # Interfaz web
│── static/              # Carpeta para archivos JS y CSS
│   ├── script.js        # Lógica del frontend
│── requirements.txt     # Dependencias de Python
│── .env                 # Variables de entorno (NO subir a Git)
│── .gitignore           # Archivos ignorados por Git
│── README.md            # Documentación del proyecto
```

---

## **📌 API - Endpoints**  
📌 **Buscar un Producto Escaneado**  
```http
GET /escanear?codigo=1234567890123
```
📌 **Ejemplo de Respuesta JSON**  
```json
{
  "codigo": "xxx",
  "nombre": "xxx",
  "lote": "xxx",
  "fecha_vencimiento": "xxxx",
  "proveedor": "xxxx",
  "mensaje": "✅ Producto encontrado y escaneo registrado."
}
```

📌 **Si el producto no existe:**  
```json
{
  "error": "⚠️ Producto no encontrado en la base de datos."
}
```

---

## **📌 Próximos Pasos**  
✅ Implementar la carga automática en **Loyal QMS** con **Selenium**.  
✅ Mejorar el **frontend en Vercel** para que funcione en múltiples dispositivos.  
✅ Agregar **historial de escaneos** en la interfaz web.  

---

## **📜 Licencia**  
📌 Proyecto desarrollado por **Cecilia Santin** para la gestión de productos en **Loyal QMS**.  
📌 Código abierto bajo la **licencia MIT**.  

---