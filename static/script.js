// 📌 Iniciar sesión y redirigir según el rol
async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorElement = document.getElementById("login-error");

    // Validación de campos vacíos
    if (!username || !password) {
        errorElement.textContent = "Por favor, ingresa usuario y contraseña.";
        return;
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem("usuario", username);
            sessionStorage.setItem("rol", data.rol);  // Guardar el rol del usuario
            window.location.href = "/home";  // Redirigir al dashboard
        } else {
            errorElement.textContent = data.error || "Error al iniciar sesión.";
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        errorElement.textContent = "No se pudo conectar al servidor.";
    }
}

// 📌 Cargar información del usuario en home.html
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si estamos en home.html antes de ejecutar
    if (window.location.pathname !== "/home") {
        return;
    }

    const username = sessionStorage.getItem("usuario");
    const rol = sessionStorage.getItem("rol");

    // Si no hay sesión, volver a index.html
    if (!username) {
        window.location.href = "/";
        return;
    }

    // Mostrar nombre de usuario en la página
    const usernameDisplay = document.getElementById("username-display");
    if (usernameDisplay) {
        usernameDisplay.textContent = username;
    }

    // Mostrar la sección de registrar usuario solo si es admin
    const adminSection = document.getElementById("admin-section");
    if (adminSection) {
        adminSection.style.display = rol === "admin" ? "block" : "none";
    }
});


// 📌 Cerrar sesión
async function logout() {
    try {
        const response = await fetch("/logout", { method: "POST" });

        if (response.ok) {
            sessionStorage.clear();
            window.location.href = "/";
        } else {
            console.error("Error al cerrar sesión");
        }
    } catch (error) {
        console.error("Error de conexión al cerrar sesión:", error);
    }
}

// 📌 Función para registrar usuario
document.addEventListener("DOMContentLoaded", function() {
    window.registrarUsuario = async function() {
        const newUsername = document.getElementById("new-username").value.trim();
        const newPassword = document.getElementById("new-password").value.trim();
        let newRol = document.getElementById("new-rol").value.trim().toLowerCase(); // Convertir a minúsculas
        const adminMessage = document.getElementById("admin-message");

        // Validación de campos vacíos
        if (!newUsername || !newPassword) {
            adminMessage.textContent = "Por favor, completa todos los campos.";
            adminMessage.style.color = "red";
            return;
        }

        // Validar que el rol sea válido antes de enviarlo
        const rolesValidos = ["deposito", "garantia"];
        if (!rolesValidos.includes(newRol)) {
            adminMessage.textContent = "⚠️ El rol debe ser 'deposito' o 'garantia'.";
            adminMessage.style.color = "red";
            return;
        }

        try {
            const response = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: newUsername, 
                    password: newPassword, 
                    rol: newRol // Enviamos el rol en minúsculas
                })
            });

            const data = await response.json();

            if (response.ok) {
                adminMessage.textContent = "✅ Usuario registrado con éxito.";
                adminMessage.style.color = "green";

                // Limpiar los campos después del registro exitoso
                document.getElementById("new-username").value = "";
                document.getElementById("new-password").value = "";
                document.getElementById("new-rol").value = "deposito"; // Volver al valor por defecto
            } else {
                adminMessage.textContent = data.error || "❌ Error al registrar usuario.";
                adminMessage.style.color = "red";
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            adminMessage.textContent = "❌ No se pudo conectar al servidor.";
            adminMessage.style.color = "red";
        }
    };
});


//🔹 Función para obtener una recepcion y mostrarla en tabla
async function cargarRecepcion() {
    const recepcionId = document.getElementById("id-recepcion").value.trim();
    const mensaje = document.getElementById("mensaje-carga");
    const tablaRecepcion = document.querySelector("#tabla-recepcion tbody");

    if (!recepcionId) {
        mensaje.textContent = "⚠️ Ingrese un ID de recepción válido.";
        return;
    }

    mensaje.textContent = "⏳ Cargando recepción...";

    try {
        const response = await fetch(`/recepcion/${recepcionId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        if (response.ok) {
            mensaje.textContent = "✅ Recepción cargada correctamente.";

            // Limpiar la tabla antes de agregar los nuevos datos
            tablaRecepcion.innerHTML = "";

            // Llenar la tabla con los productos de la recepción
            data.productos.forEach(producto => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${producto.codigo}</td>
                    <td>${producto.nro_lote}</td>
                    <td>${producto.fecha_vto}</td>
                    <td>${producto.temperatura}</td>
                    <td>${producto.cantidad_ingresada}</td>
                    <td>${producto.nro_partida_asignada}</td>
                `;
                tablaRecepcion.appendChild(fila);
            });

        } else {
            mensaje.textContent = data.error || "⚠️ No se encontró la recepción.";
        }
    } catch (error) {
        console.error("Error:", error);
        mensaje.textContent = "❌ Error al comunicarse con el servidor.";
    }
}

// 🔹 Función para iniciar Selenium en el backend y completar el formulario en Loyal
async function iniciarSelenium() {
    const codigoFormulario = document.getElementById("codigo-formulario").value.trim();
    const mensaje = document.getElementById("mensaje-carga");

    if (!codigoFormulario) {
        mensaje.textContent = "⚠️ Ingrese un código de formulario válido.";
        return;
    }

    mensaje.textContent = "⏳ Procesando...";

    try {
        const response = await fetch("/iniciarSelenium", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo: codigoFormulario })
        });

        const data = await response.json();
        if (response.ok) {
            mensaje.textContent = "✅ Formulario completado en Loyal.";
        } else {
            mensaje.textContent = data.error || "⚠️ No se pudo completar el formulario.";
        }
    } catch (error) {
        console.error("Error:", error);
        mensaje.textContent = "❌ Error al comunicarse con el servidor.";
    }
}

