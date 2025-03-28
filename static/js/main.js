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

document.addEventListener("DOMContentLoaded", function() {
    cargarUsuarios();

    // 📌 Registrar Usuario
    document.getElementById("form-registrar-usuario").addEventListener("submit", async function(event) {
        event.preventDefault();

        const username = document.getElementById("new-username").value.trim();
        const password = document.getElementById("new-password").value.trim();
        const rol = document.getElementById("new-rol").value.trim().toLowerCase();

        if (!username || !password || !rol) {
            alert("⚠️ Todos los campos son obligatorios.");
            return;
        }

        try {
            const response = await fetch("/admin/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, rol })
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Usuario registrado con éxito.");
                document.getElementById("form-registrar-usuario").reset();
                cargarUsuarios();
            } else {
                alert(data.error || "❌ Error al registrar usuario.");
            }
        } catch (error) {
            console.error("❌ Error de conexión:", error);
        }
    });
});

// 📌 Función para cargar la lista de usuarios
async function cargarUsuarios() {
    try {
        const response = await fetch("/admin/usuarios/lista");
        const usuarios = await response.json();

        const tabla = document.getElementById("tabla-usuarios").querySelector("tbody");
        tabla.innerHTML = "";

        usuarios.forEach(usuario => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${usuario.username}</td>
                <td>${usuario.rol}</td>
                <td>
                    <button onclick="eliminarUsuario('${usuario.username}')" class="btn-eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("❌ Error al cargar usuarios:", error);
    }
}

// 📌 Función para eliminar usuario
async function eliminarUsuario(username) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
        const response = await fetch(`/admin/usuarios/eliminar/${username}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ Usuario eliminado con éxito.");
            cargarUsuarios();
        } else {
            alert(data.error || "❌ Error al eliminar usuario.");
        }
    } catch (error) {
        console.error("❌ Error al eliminar usuario:", error);
    }
}

