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

// 📌 Función para analizar un código UDI GS1
function analizarUDI(codigoUDI) {
    console.log(`📥 Código recibido para análisis: ${codigoUDI}`);

    // Nueva RegEx corregida
    const regex = /01(\d{14})17(\d{6})10([\w\-\.\_]+)/;
    const match = codigoUDI.match(regex);

    if (!match) {
        console.error(`❌ Error: Código UDI no reconocido: ${codigoUDI}`);
        alert("⚠️ Código UDI no válido o no reconocido.");
        return;
    }

    const gtin = match[1]; // GTIN (Código Base)
    const fechaVencimiento = match[2]; // Fecha de Vencimiento en formato YYMMDD
    const nroLote = match[3]; // Número de Lote

    console.log(`✅ GTIN: ${gtin}, Fecha Vto: ${fechaVencimiento}, Lote: ${nroLote}`);

    // 📌 Convertir fecha de vencimiento de YYMMDD a YYYY-MM-DD
    const year = "20" + fechaVencimiento.substring(0, 2);
    const month = fechaVencimiento.substring(2, 4);
    const day = fechaVencimiento.substring(4, 6);
    const fechaFormateada = `${year}-${month}-${day}`;

    // ✅ Autocompletar los campos en el formulario
    document.getElementById("codigo").value = gtin;
    document.getElementById("nro_lote").value = nroLote;
    document.getElementById("fecha_vto").value = fechaFormateada;

    console.log(`📌 Código extraído: ${gtin}, Lote: ${nroLote}, Fecha Vto: ${fechaFormateada}`);

    // 🔍 Buscar en ProductoBase y completar INS/MAT/PROD y Proveedor
    buscarProductoBase(gtin);
}


// 📌 Evento para ejecutar la función cuando el usuario escanee un código
document.getElementById("codigo").addEventListener("input", function () {
    const codigo = this.value.trim();
    if (codigo.length > 20) { // Suponiendo que el UDI tiene más de 20 caracteres
        analizarUDI(codigo);
    }
});

// 📌 Función para buscar en ProductoBase y autocompletar campos adicionales
async function buscarProductoBase(codigoBase) {
    try {
        const response = await fetch(`/producto-base/${codigoBase}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById("ins-mat-prod").value = data.ins_mat_prod;
            document.getElementById("proveedor-producto").value = data.proveedor;
            document.getElementById("codigo_tango").value = data.codigo_tango;
        } else {
            console.warn("⚠️ Producto no encontrado en la base.");
        }
    } catch (error) {
        console.error("❌ Error al buscar el producto base:", error);
    }
}
// 📌 Función para eliminar un producto escaneado
function eliminarProducto(boton, codigo) {
    // Eliminar de la lista de productos escaneados
    productosEscaneados = productosEscaneados.filter(producto => producto.codigo !== codigo);

    // Eliminar la fila de la tabla visualmente
    const fila = boton.closest("tr");
    if (fila) {
        fila.remove();
    }

    console.log("Productos escaneados después de eliminar:", productosEscaneados);
}


// 📌 Función para limpiar los campos del formulario
function limpiarFormulario() {
    document.getElementById("codigo").value = "";
    document.getElementById("codigo_tango").value = "";
    document.getElementById("ins-mat-prod").value = "";
    document.getElementById("proveedor-producto").value = "";
    document.getElementById("nro_lote").value = "";
    document.getElementById("fecha_vto").value = "";
    document.getElementById("temperatura").value = "";
    document.getElementById("cantidad_ingresada").value = "";
    document.getElementById("nro_partida_asignada").value = "";
}

// 🔹 Lista temporal para productos antes de asociarlos a una recepción
let productosEscaneados = [];

// 📌 Función para escanear un producto y guardarlo en la base de datos
async function escanearProducto() {
    console.log("📌 Se hizo clic en el botón de registrar"); // 👈 Verifica que se activa

    const codigo = document.getElementById("codigo").value.trim();
    const insMatProd = document.getElementById("ins-mat-prod").value.trim();
    const proveedor = document.getElementById("proveedor-producto").value.trim();
    const codigoTango = document.getElementById("codigo_tango").value.trim();
    const nroLote = document.getElementById("nro_lote").value.trim();
    const fechaVto = document.getElementById("fecha_vto").value.trim();
    const temperatura = document.getElementById("temperatura").value.trim();
    const cantidad = document.getElementById("cantidad_ingresada").value.trim();
    const nroPartida = document.getElementById("nro_partida_asignada").value.trim();
    const mensaje = document.getElementById("producto-mensaje");

    console.log(`📌 Código escaneado: ${codigo}`);

    if (!codigo || !insMatProd || !proveedor || !codigoTango || !nroLote || !fechaVto || !cantidad || !nroPartida) {
        mensaje.textContent = "⚠️ Complete todos los campos antes de registrar el producto.";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = "⏳ Registrando producto...";

    try {
        const response = await fetch("/escanear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codigo,
                codigo_tango: codigoTango,
                ins_mat_prod: insMatProd,
                proveedor: proveedor,
                nro_lote: nroLote,
                fecha_vto: fechaVto,
                temperatura,
                cantidad_ingresada: cantidad,
                nro_partida_asignada: nroPartida
            })
        });

        const data = await response.json();
        console.log(`📤 Respuesta del servidor: ${JSON.stringify(data)}`);

        if (response.ok) {
            mensaje.textContent = "✅ Producto registrado correctamente.";
            mensaje.style.color = "green";

            // 🔹 Agregar producto escaneado a la tabla con checkbox
            let tabla = document.querySelector("#tabla-productos-escaneados tbody");
            let fila = document.createElement("tr");
            fila.innerHTML = `
                <td><input type="checkbox" class="producto-checkbox" value="${codigo}"></td>
                <td>${codigo}</td>
                <td>${insMatProd}</td>
                <td>${nroLote}</td>
                <td>${fechaVto}</td>
                <td>${temperatura || "-"}</td>
                <td>${cantidad}</td>
                <td><button onclick="eliminarProducto(this, '${codigo}')" class="btn-eliminar">❌</button></td>
            `;
            tabla.appendChild(fila);

            // 🔹 Agregar producto escaneado a la lista temporal
            productosEscaneados.push({
                codigo,
                codigo_tango: codigoTango,
                ins_mat_prod: insMatProd,
                proveedor: proveedor,
                nro_lote: nroLote,
                fecha_vto: fechaVto,
                temperatura: temperatura ? parseFloat(temperatura) : null,
                cantidad_ingresada: cantidad,
                nro_partida_asignada: nroPartida
            });

            console.log("📌 Productos escaneados hasta ahora:", productosEscaneados);

            // 🔹 Limpiar campos después del escaneo
            document.getElementById("codigo").value = "";
            document.getElementById("nro_lote").value = "";
            document.getElementById("fecha_vto").value = "";
            document.getElementById("temperatura").value = "";
            document.getElementById("cantidad_ingresada").value = "";
            document.getElementById("nro_partida_asignada").value = "";

            // ✅ LIMPIAR FORMULARIO DESPUÉS DEL REGISTRO
            limpiarFormulario();

        } else {
            mensaje.textContent = data.error || "⚠️ No se pudo registrar el producto.";
            mensaje.style.color = "red";
        }
    } catch (error) {
        console.error("❌ Error al comunicarse con el servidor:", error);
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

    // 🔹 Obtener productos seleccionados
    let productosSeleccionados = [];
    document.querySelectorAll(".producto-checkbox:checked").forEach(checkbox => {
        productosSeleccionados.push(checkbox.value);
    });

    if (productosSeleccionados.length === 0) {
        mensaje.textContent = "⚠️ No hay productos seleccionados para asociar a la recepción.";
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
                productos: productosSeleccionados // ✅ Enviar solo los productos marcados
            })
        });

        const data = await response.json();

        if (response.ok) {
            mensaje.textContent = `✅ Recepción creada con ID: ${data.id}`;
            mensaje.style.color = "green";

            // 🔹 Limpiar la tabla de productos escaneados
            document.querySelector("#tabla-productos-escaneados tbody").innerHTML = "";

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




