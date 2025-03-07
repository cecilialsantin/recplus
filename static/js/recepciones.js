
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
            
            // ✅ Guardar en localStorage
            localStorage.setItem("productosEscaneados", JSON.stringify(productosEscaneados));
            actualizarTablaProductos();  // ✅ Actualizar la tabla

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

// 📌 Al cargar la página, restaurar productos escaneados desde localStorage
document.addEventListener("DOMContentLoaded", () => {
    const productosGuardados = localStorage.getItem("productosEscaneados");
    if (productosGuardados) {
        productosEscaneados = JSON.parse(productosGuardados);
        actualizarTablaProductos();  // ✅ Mostrar productos guardados en la tabla
    }
});

// 📌 Función para actualizar la tabla de productos escaneados
function actualizarTablaProductos() {
    let tabla = document.querySelector("#tabla-productos-escaneados tbody");
    tabla.innerHTML = "";

    productosEscaneados.forEach(producto => {
        let fila = document.createElement("tr");
        fila.innerHTML = `
            <td><input type="checkbox" class="producto-checkbox" value="${producto.codigo}"></td>
            <td>${producto.codigo}</td>
            <td>${producto.ins_mat_prod}</td>
            <td>${producto.nro_lote}</td>
            <td>${producto.fecha_vto}</td>
            <td>${producto.temperatura || "-"}</td>
            <td>${producto.cantidad_ingresada}</td>
            <td><button onclick="eliminarProducto(this, '${producto.codigo}')" class="btn-eliminar">❌</button></td>
        `;
        tabla.appendChild(fila);
    });
}

// 📌 Función para crear una recepción y asociarle productos
async function crearRecepcion() {
    const subproceso = document.getElementById("subproceso").value;
    const mensaje = document.getElementById("recepcion-message");

    // 🔹 Inicializar proveedor antes de la validación
    let proveedor = null;

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

    // ✅ Tomar el proveedor del primer producto escaneado
    const primerProducto = productosEscaneados.find(prod => productosSeleccionados.includes(prod.codigo));
    
    if (primerProducto) {
        proveedor = primerProducto.proveedor; // ✅ Asignar proveedor si se encuentra un producto
    }

    if (!subproceso || !proveedor) {
        mensaje.textContent = "⚠️ Complete todos los campos antes de crear la recepción.";
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
                proveedor, // ✅ Enviar el proveedor del primer producto escaneado
                productos: productosSeleccionados // ✅ Enviar solo los productos marcados
            })
        });

        const data = await response.json();

        if (response.ok) {
            mensaje.textContent = `✅ Recepción creada con ID: ${data.id}`;
            mensaje.style.color = "green";

            localStorage.removeItem("productosEscaneados");  // ✅ Borrar productos una vez creada la recepción
            productosEscaneados = [];
            actualizarTablaProductos();

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

// 📌 Función para cargar todas las recepciones y mostrarlas en la tabla
async function cargarRecepciones() {
    const tablaRecepciones = document.querySelector("#tabla-recepciones tbody");

    try {
        const response = await fetch("/recepciones");
        const data = await response.json();

        console.log("📌 Recepciones obtenidas:", data); // 🔹 Depuración

        // Limpiar la tabla antes de agregar los datos
        tablaRecepciones.innerHTML = "";

        data.forEach(recepcion => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${recepcion.id}</td>
                <td>${recepcion.fecha}</td>
                <td>${recepcion.subproceso}</td>
                <td>${recepcion.proveedor}</td>
                <td>${recepcion.productos.length} producto(s)</td>
                <td>
                    <button class="btn-detalles" onclick="toggleDetalles(${recepcion.id})">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                </td>
            `;

            // Fila para los productos (inicialmente oculta)
            const detallesFila = document.createElement("tr");
            detallesFila.id = `detalles-${recepcion.id}`;
            detallesFila.style.display = "none";
            detallesFila.innerHTML = `
                <td colspan="6">
                    <table class="tabla-detalle-productos">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>INS/MAT/PROD</th>
                                <th>Nro Lote</th>
                                <th>Fecha Vto</th>
                                <th>Temperatura</th>
                                <th>Cantidad</th>
                                <th>Nro Partida</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recepcion.productos.map(p => `
                                <tr>
                                    <td>${p.codigo}</td>
                                    <td>${p.ins_mat_prod}</td>
                                    <td>${p.nro_lote}</td>
                                    <td>${p.fecha_vto}</td>
                                    <td>${p.temperatura ? `${p.temperatura}°C` : "-"}</td>
                                    <td>${p.cantidad_ingresada}</td>
                                    <td>${p.nro_partida_asignada}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </td>
            `;

            tablaRecepciones.appendChild(fila);
            tablaRecepciones.appendChild(detallesFila);
        });

    } catch (error) {
        console.error("❌ Error al obtener las recepciones:", error);
    }
}


// 📌 Función para expandir/contraer los detalles de productos
function toggleDetalles(recepcionId) {
    const detallesFila = document.getElementById(`detalles-${recepcionId}`);
    if (detallesFila.style.display === "none") {
        detallesFila.style.display = "table-row";
    } else {
        detallesFila.style.display = "none";
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

        console.log("📌 Respuesta de la API:", data); // 🔹 Depuración en consola

        if (response.ok) {
            mensaje.textContent = "✅ Recepción cargada correctamente.";
            mensaje.style.color = "green";

            if (!Array.isArray(data.productos) || data.productos.length === 0) {
                console.warn("⚠️ La recepción no tiene productos asociados.");
                mensaje.textContent = "⚠️ La recepción no tiene productos asociados.";
                mensaje.style.color = "orange";
                return;
            }

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
                    <td>${producto.temperatura ? `${producto.temperatura}°C` : "-"}</td>
                    <td>${producto.cantidad_ingresada}</td>
                    <td>${producto.nro_partida_asignada}</td>
                `;
                tablaRecepcion.appendChild(fila);
            });

        } else {
            console.error("❌ Error en la API:", data);
            mensaje.textContent = data.error || "⚠️ No se encontró la recepción.";
            mensaje.style.color = "red";
        }
    } catch (error) {
        console.error("❌ Error al comunicarse con el servidor:", error);
        mensaje.textContent = "❌ No se pudo conectar con el servidor.";
        mensaje.style.color = "red";
    }
}

// 📌 Función para filtrar recepciones por subproceso o proveedor ingresado manualmente
async function filtrarRecepciones() {
    
    const proveedorFiltro = document.getElementById("filtro-proveedor").value.trim().toLowerCase();
    const tablaRecepciones = document.querySelector("#tabla-recepciones tbody");

    try {
        const response = await fetch("/recepciones");
        const data = await response.json();

        // Filtrar las recepciones según lo que se escribió en el input de proveedor
        const recepcionesFiltradas = data.filter(recepcion => {
            return (
                (proveedorFiltro === "" || recepcion.proveedor.toLowerCase().includes(proveedorFiltro))
            );
        });

        // Limpiar la tabla antes de agregar los datos filtrados
        tablaRecepciones.innerHTML = "";

        // Mostrar recepciones filtradas manteniendo el formato de `cargarRecepciones()`
        recepcionesFiltradas.forEach(recepcion => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${recepcion.id}</td>
                <td>${recepcion.fecha}</td>
                <td>${recepcion.subproceso}</td>
                <td>${recepcion.proveedor}</td>
                <td>${recepcion.productos.length} producto(s)</td>
                <td>
                    <button class="btn-detalles" onclick="toggleDetalles(${recepcion.id})">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                </td>
            `;

            // Fila para los productos (inicialmente oculta)
            const detallesFila = document.createElement("tr");
            detallesFila.id = `detalles-${recepcion.id}`;
            detallesFila.style.display = "none";
            detallesFila.innerHTML = `
                <td colspan="6">
                    <table class="tabla-detalle-productos">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>INS/MAT/PROD</th>
                                <th>Nro Lote</th>
                                <th>Fecha Vto</th>
                                <th>Temperatura</th>
                                <th>Cantidad</th>
                                <th>Nro Partida</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recepcion.productos.map(p => `
                                <tr>
                                    <td>${p.codigo}</td>
                                    <td>${p.ins_mat_prod}</td>
                                    <td>${p.nro_lote}</td>
                                    <td>${p.fecha_vto}</td>
                                    <td>${p.temperatura ? `${p.temperatura}°C` : "-"}</td>
                                    <td>${p.cantidad_ingresada}</td>
                                    <td>${p.nro_partida_asignada}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </td>
            `;

            tablaRecepciones.appendChild(fila);
            tablaRecepciones.appendChild(detallesFila);
        });

    } catch (error) {
        console.error("❌ Error al filtrar las recepciones:", error);
    }
}

// 📌 Detectar cambios en el input y filtrar automáticamente mientras se escribe
document.getElementById("filtro-proveedor").addEventListener("input", filtrarRecepciones);


async function cargarProveedores() {
    const filtroProveedor = document.getElementById("filtro-proveedor");

    if (!filtroProveedor) {
        console.error("❌ ERROR: No se encontró el elemento #filtro-proveedor en el DOM.");
        return;
    }

    try {
        const response = await fetch("/proveedores");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const proveedores = await response.json();
        console.log("📌 Proveedores obtenidos:", proveedores);

        if (!proveedores || proveedores.length === 0) {
            console.warn("⚠️ No hay proveedores disponibles.");
            return;
        }

        // ✅ Limpiar opciones existentes antes de agregar nuevas
        filtroProveedor.innerHTML = '<option value="">Todos los Proveedores</option>';

        // ✅ Agregar opciones como `option.value`
        proveedores.forEach(proveedor => {
            let option = document.createElement("option");
            option.value = proveedor;   // 🔹 Value es el nombre del proveedor
            option.textContent = proveedor;  // 🔹 Lo que se muestra en la UI
            filtroProveedor.appendChild(option);
        });

        console.log("✅ Proveedores cargados correctamente en el select.");

    } catch (error) {
        console.error("❌ ERROR al obtener los proveedores:", error);
    }
}


document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 DOM completamente cargado.");
    
    setTimeout(() => {
        cargarRecepciones();
        cargarProveedores(); // Ejecuta después de que el DOM está listo
    }, 500);  // 🔹 Espera 500ms antes de ejecutarse
});


