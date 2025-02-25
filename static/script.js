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

// 🔹 Lista temporal para productos antes de asociarlos a una recepción
let productosEscaneados = [];

// 📌 Función para buscar un producto en ProductoBase al escanear el código
async function buscarProductoBase(codigo) {
    try {
        const response = await fetch(`/producto_base/${codigo}`);
        const data = await response.json();

        if (response.ok) {
            return data; // ✅ Devuelve el producto encontrado en ProductoBase
        } else {
            console.warn("⚠️ Producto no encontrado en ProductoBase.");
            return null;
        }
    } catch (error) {
        console.error("❌ Error al buscar en ProductoBase:", error);
        return null;
    }
}

// 📌 Función para escanear un producto y guardarlo en la base de datos
async function escanearProducto() {
    const codigo = document.getElementById("codigo").value.trim();
    const insMatProdField = document.getElementById("ins-mat-prod");
    const proveedorField = document.getElementById("proveedor-producto");
    const codigoTangoField = document.getElementById("codigo_tango"); // ✅ Nuevo campo
    const nroLote = document.getElementById("nro_lote").value.trim();
    const fechaVto = document.getElementById("fecha_vto").value.trim();
    const temperatura = document.getElementById("temperatura").value.trim();
    const cantidad = document.getElementById("cantidad_ingresada").value.trim();
    const nroPartida = document.getElementById("nro_partida_asignada").value.trim();
    const mensaje = document.getElementById("producto-mensaje");

    if (!codigo || !nroLote || !fechaVto || !cantidad || !nroPartida) {
        mensaje.textContent = "⚠️ Complete todos los campos antes de registrar el producto.";
        mensaje.style.color = "red";
        return;
    }

    // 🔹 Buscar datos en ProductoBase
    let productoBase = await buscarProductoBase(codigo);

    if (!productoBase) {
        mensaje.textContent = "⚠️ Producto no registrado en la base de datos.";
        mensaje.style.color = "red";
        return;
    }

    // ✅ Autocompletar los campos con los datos de ProductoBase
    insMatProdField.value = productoBase.ins_mat_prod;
    proveedorField.value = productoBase.proveedor;
    codigoTangoField.value = productoBase.codigo_tango;

    mensaje.textContent = "⏳ Registrando producto...";

    try {
        const response = await fetch("/escanear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codigo,
                codigo_tango: productoBase.codigo_tango, // ✅ Nuevo campo agregado
                ins_mat_prod: productoBase.ins_mat_prod,
                proveedor: productoBase.proveedor,
                nro_lote: nroLote,
                fecha_vto: fechaVto,
                temperatura,
                cantidad_ingresada: cantidad,
                nro_partida_asignada: nroPartida
            })
        });

        const data = await response.json();

        if (response.ok) {
            mensaje.textContent = "✅ Producto registrado correctamente.";
            mensaje.style.color = "green";

            // 🔹 Agregar producto escaneado a la lista temporal
            productosEscaneados.push({
                codigo,
                codigo_tango: productoBase.codigo_tango,
                ins_mat_prod: productoBase.ins_mat_prod,
                proveedor: productoBase.proveedor,
                nro_lote: nroLote,
                fecha_vto: fechaVto,
                temperatura,
                cantidad_ingresada: cantidad,
                nro_partida_asignada: nroPartida
            });

            console.log("Productos escaneados:", productosEscaneados);

            // 🔹 Limpiar campos después del escaneo (excepto los autocompletados)
            document.getElementById("codigo").value = "";
            document.getElementById("nro_lote").value = "";
            document.getElementById("fecha_vto").value = "";
            document.getElementById("temperatura").value = "";
            document.getElementById("cantidad_ingresada").value = "";
            document.getElementById("nro_partida_asignada").value = "";

        } else {
            mensaje.textContent = data.error || "⚠️ No se pudo registrar el producto.";
            mensaje.style.color = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        mensaje.textContent = "❌ Error al comunicarse con el servidor.";
        mensaje.style.color = "red";
    }
}

// 📌 Función para crear una recepción y asociarle productos
async function crearRecepcion() {
    const subproceso = document.getElementById("subproceso").value;
    const proveedor = document.getElementById("proveedor").value;
    const mensaje = document.getElementById("recepcion-message");

    if (!subproceso || !proveedor) {
        mensaje.textContent = "⚠️ Complete todos los campos antes de crear la recepción.";
        mensaje.style.color = "red";
        return;
    }

    if (productosEscaneados.length === 0) {
        mensaje.textContent = "⚠️ No hay productos escaneados para asociar a la recepción.";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = "⏳ Creando recepción...";

    try {
        const response = await fetch("/recepcion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                subproceso,
                proveedor,
                productos: productosEscaneados.map(p => p.codigo) // ✅ Se envían los códigos de productos escaneados
            })
        });

        const data = await response.json();

        if (response.ok) {
            mensaje.textContent = `✅ Recepción creada con ID: ${data.id}`;
            mensaje.style.color = "green";
            productosEscaneados = []; // 🔹 Limpiar lista de productos después de asociarlos

            // Limpiar campos
            document.getElementById("subproceso").value = "";
            document.getElementById("proveedor").value = "";

        } else {
            mensaje.textContent = data.error || "⚠️ No se pudo crear la recepción.";
            mensaje.style.color = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        mensaje.textContent = "❌ Error al comunicarse con el servidor.";
        mensaje.style.color = "red";
    }
}

// 📌 Función para cargar las recepciones y mostrarlas en la tabla
async function cargarRecepciones() {
    const tablaRecepciones = document.querySelector("#tabla-recepciones tbody");

    try {
        const response = await fetch("/recepciones");
        const data = await response.json();

        // Limpiar la tabla antes de agregar los datos
        tablaRecepciones.innerHTML = "";

        data.forEach(recepcion => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${recepcion.id}</td>
                <td>${recepcion.fecha}</td>
                <td>${recepcion.subproceso}</td>
                <td>${recepcion.proveedor}</td>
                <td>${recepcion.productos.map(p => p.codigo).join(", ")}</td>
            `;
            tablaRecepciones.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al obtener las recepciones:", error);
    }
}

// 📌 Función para cargar una recepción específica y sus productos
async function cargarRecepcion() {
    const recepcionId = document.getElementById("id-recepcion").value.trim();
    const mensaje = document.getElementById("mensaje-carga");
    const tablaRecepcion = document.querySelector("#tabla-recepcion tbody");

    if (!recepcionId) {
        mensaje.textContent = "⚠️ Ingrese un ID de recepción válido.";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = "⏳ Cargando recepción...";

    try {
        const response = await fetch(`/recepcion/${recepcionId}`);
        const data = await response.json();

        if (response.ok) {
            mensaje.textContent = "✅ Recepción cargada correctamente.";
            mensaje.style.color = "green";

            // Limpiar la tabla antes de agregar los nuevos datos
            tablaRecepcion.innerHTML = "";

            // Llenar la tabla con los productos de la recepción
            data.productos.forEach(producto => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${producto.codigo}</td>
                    <td>${producto.ins_mat_prod}</td>
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
            mensaje.style.color = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        mensaje.textContent = "❌ Error al comunicarse con el servidor.";
        mensaje.style.color = "red";
    }
}

// 📌 Función para filtrar recepciones por subproceso o proveedor
async function filtrarRecepciones() {
    const subprocesoFiltro = document.getElementById("filtro-subproceso").value;
    const proveedorFiltro = document.getElementById("filtro-proveedor").value;
    const tablaRecepciones = document.querySelector("#tabla-recepciones tbody");

    try {
        const response = await fetch("/recepciones");
        const data = await response.json();

        // Filtrar los datos según la selección del usuario
        const recepcionesFiltradas = data.filter(recepcion => {
            return (
                (subprocesoFiltro === "" || recepcion.subproceso === subprocesoFiltro) &&
                (proveedorFiltro === "" || recepcion.proveedor === proveedorFiltro)
            );
        });

        // Limpiar la tabla antes de agregar los datos filtrados
        tablaRecepciones.innerHTML = "";

        // Mostrar solo las recepciones filtradas
        recepcionesFiltradas.forEach(recepcion => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${recepcion.id}</td>
                <td>${recepcion.fecha}</td>
                <td>${recepcion.subproceso}</td>
                <td>${recepcion.proveedor}</td>
                <td>${recepcion.productos.map(p => `${p.codigo} (${p.ins_mat_prod})`).join(", ")}</td>
            `;
            tablaRecepciones.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al filtrar las recepciones:", error);
    }
}




