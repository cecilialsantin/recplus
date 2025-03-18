// 📌 Abrir el modal modificar partidas manualmente
document.getElementById("btn-abrir-modal").addEventListener("click", function () {
    document.getElementById("modalPartida").style.display = "block";
});

// 📌 Cerrar el modal modificar partidas manualmente
function cerrarModal() {
    document.getElementById("modalPartida").style.display = "none";
}

// 📌 Función para cargar la última partida de una categoría
async function cargarPartidaReferencia(catPartida) {
    if (!catPartida) return;

    try {
        const response = await fetch(`/ultima-partida/${catPartida}`);
        const data = await response.json();

        const inputPartida = document.getElementById("input-ultima-partida");
        const btnGuardar = document.getElementById("btn-guardar-partida");

        if (data.ultima_partida) {
            inputPartida.value = data.ultima_partida;
            btnGuardar.setAttribute("data-modo", "editar");
            btnGuardar.textContent = "Actualizar Partida";
        } else {
            inputPartida.value = "";
            btnGuardar.setAttribute("data-modo", "nueva");
            btnGuardar.textContent = "Agregar Nueva Partida";
        }

    } catch (error) {
        console.error("❌ Error al obtener la última partida:", error);
    }
}

// 📌 Guardar o actualizar la partida manualmente
document.getElementById("btn-guardar-partida").addEventListener("click", async function () {
    const catPartida = document.getElementById("select-cat-partida").value;
    const nuevaPartida = document.getElementById("input-ultima-partida").value.trim();
    const modo = this.getAttribute("data-modo");

    if (!nuevaPartida) {
        alert("⚠️ Debes ingresar una partida.");
        return;
    }

    const endpoint = modo === "editar" ? "/actualizar-partida" : "/agregar-partida";
    const metodo = modo === "editar" ? "PUT" : "POST";

    try {
        const response = await fetch(endpoint, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cat_partida: catPartida, ultima_partida: nuevaPartida })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`✅ Partida ${modo === "editar" ? "actualizada" : "agregada"} correctamente.`);
            cerrarModal();
        } else {
            alert(`❌ Error: ${data.error}`);
        }

    } catch (error) {
        console.error("❌ Error al guardar la partida:", error);
    }
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
    const campos = [
        "codigo",
        "codigo_tango",
        "ins-mat-prod",
        "proveedor-producto",
        "nro_lote",
        "fecha_vto",
        "temperatura",
        "cantidad_ingresada",
        "nro_partida_asignada"
    ];
    
    campos.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.value = "";
        } else {
            console.warn(`No se encontró el elemento con id: ${id}`);
        }
    });
}


// 🔹 Lista temporal para productos antes de asociarlos a una recepción
let productosEscaneados = [];

async function escanearProducto() {
    console.log("📌 Se hizo clic en el botón de registrar");

    const recepcionId = localStorage.getItem("recepcion_id"); // Obtener la recepción actual
    if (!recepcionId) {
        alert("⚠️ Debe crear una recepción antes de escanear productos.");
        return;
    }

    const codigo = document.getElementById("codigo").value.trim();
    const nroLote = document.getElementById("nro_lote").value.trim();
    const fechaVto = document.getElementById("fecha_vto").value.trim();
    const temperatura = document.getElementById("temperatura").value.trim();
    const cantidad = document.getElementById("cantidad_ingresada").value.trim();
    const mensaje = document.getElementById("producto-mensaje");

    if (!codigo || !nroLote || !fechaVto || !cantidad) {
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
                nro_lote: nroLote,
                fecha_vto: fechaVto,
                temperatura,
                cantidad_ingresada: cantidad,
                recepcion_id: recepcionId // Se asocia la recepción
            })
        });

        const data = await response.json();
        console.log(`📤 Respuesta del servidor: ${JSON.stringify(data)}`);

        if (response.ok) {
            mensaje.textContent = "✅ Producto registrado correctamente.";
            mensaje.style.color = "green";

            limpiarFormulario()

            // Agregar producto a la tabla visual con todos los campos
            let tabla = document.querySelector("#tabla-productos-escaneados tbody");
            let fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${recepcionId}</td>
                <td>${codigo}</td>
                <td>${data.codigo_tango}</td>
                <td>${data.ins_mat_prod}</td>
                <td>${data.proveedor}</td>
                <td>${nroLote}</td>
                <td>${fechaVto}</td>
                <td>${temperatura || "-"}</td>
                <td>${cantidad}</td>
                <td>${data.nro_partida_asignada}</td>
                <td><button class="btn-eliminar" onclick="eliminarProducto(this, ${data.producto_id})"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tabla.appendChild(fila);

           

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
            <td>${producto.nro_partida_asignada}</td>
            <td><button onclick="eliminarProducto(this, '${producto.codigo}')"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tabla.appendChild(fila);
    });
}

// funcion para buscar el exacto proveedor 
document.addEventListener("DOMContentLoaded", function () {
    const proveedorInput = document.getElementById("proveedor");
    const datalist = document.getElementById("proveedor-sugerencias");
    let listaProveedores = [];

    // 📌 Evento para sugerencias de proveedores al escribir
    proveedorInput.addEventListener("input", async function () {
        const proveedorTexto = this.value.trim();

        if (proveedorTexto.length < 3) {
            return; // No buscar si tiene menos de 3 caracteres
        }

        try {
            const response = await fetch(`/admin/productosBase/buscar-proveedor/${proveedorTexto}`);
            const proveedores = await response.json();

            if (response.ok) {
                datalist.innerHTML = ""; // Limpiar opciones previas
                listaProveedores = proveedores.map(prov => prov.proveedor); // Guardar la lista de proveedores

                proveedores.forEach(prov => {
                    const option = document.createElement("option");
                    option.value = prov.proveedor; // Mostrar el nombre exacto del proveedor registrado
                    datalist.appendChild(option);
                });
            }
        } catch (error) {
            console.error("❌ Error al buscar proveedores:", error);
        }
    });

    // 📌 Validar que el proveedor seleccionado existe en la lista
    proveedorInput.addEventListener("change", function () {
        if (!listaProveedores.includes(this.value)) {
            alert("⚠️ Seleccione un proveedor válido de la lista.");
            this.value = ""; // Limpiar el input si no es válido
        }
    });
});


// 📌 Función para crear una recepción y asociarle productos
async function crearRecepcion() {
    const subproceso = document.getElementById("subproceso").value;
    const proveedor = document.getElementById("proveedor").value;
    const mensaje = document.getElementById("recepcion-message");

    if (!subproceso || !proveedor) {
        mensaje.textContent = "⚠️ Complete todos los campos.";
        mensaje.style.color = "red";
        return;
    }

     // 📌 Verificar que el proveedor ingresado está en la lista de sugerencias
     const opciones = [...document.getElementById("proveedor-sugerencias").options].map(opt => opt.value);
     if (!opciones.includes(proveedor)) {
         mensaje.textContent = "⚠️ Debe seleccionar un proveedor válido de la lista.";
         mensaje.style.color = "red";
         return;
     }

    try {
        const response = await fetch("/crear-recepcion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subproceso, proveedor })
        });

        const data = await response.json();

        if (response.ok) {
            mensaje.textContent = "Recepción creada exitosamente, continuar con el escaneo de los productos.";
            mensaje.style.color = "green";
            mensaje.style.fontSize = "20px";
            mensaje.style.border = "2px solid pink";
            mensaje.style.borderRadius = "25px";
            mensaje.style.padding = "10px";


            // Guardar ID de recepción en localStorage
            localStorage.setItem("recepcion_id", data.recepcion_id);

            // ✅ Habilitar la sección de escaneo
            document.getElementById("scan-section").style.display = "block";
        } else {
            mensaje.textContent = data.error || "❌ Error al crear la recepción.";
            mensaje.style.color = "red";
        }
    } catch (error) {
        console.error("❌ Error al comunicarse con el servidor:", error);
        mensaje.textContent = "❌ Error al comunicarse con el servidor.";
        mensaje.style.color = "red";
    }
}

// Funcion para eliminar un producto
async function eliminarProducto(btn, productoId) {
    if (!confirm("⚠️ ¿Estás seguro de eliminar este producto?")) {
        return;
    }

    try {
        const response = await fetch(`/eliminar-producto/${productoId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.mensaje);
            // Elimina la fila (tr) que contiene el botón
            const row = btn.closest("tr");
            if (row) {
                row.remove();
            }
        } else {
            alert(data.error || "❌ Error al eliminar producto.");
        }
    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
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
            mensaje.textContent = "✅ Recepción cargada correctamente";
            mensaje.style.color = "green";
            mensaje.style.fontSize = "12px";

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


