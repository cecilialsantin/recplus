/*document.addEventListener("DOMContentLoaded", function () {

    // 📌 Función para cargar la recepción y mostrar productos en la tabla
    window.cargarRecepcion = async function () {
        const idRecepcion = document.getElementById("id-recepcion").value.trim();
        const mensajeCarga = document.getElementById("mensaje-carga");

        if (!idRecepcion) {
            mensajeCarga.textContent = "⚠️ Debe ingresar un ID de recepción.";
            mensajeCarga.style.color = "red";
            return;
        }

        console.log('🔍 Solicitando recepción con ID: ${idRecepcion}'); // Depuración

        try {
            const response = await fetch(`/recepcion/${idRecepcion}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();

            console.log("📌 Respuesta de la API en Automatización:", data); // Depuración

            if (response.ok) {
                mensajeCarga.textContent = "✅ Recepción cargada correctamente.";
                mensajeCarga.style.color = "green";

                if (!Array.isArray(data.productos) || data.productos.length === 0) {
                    console.warn("⚠️ La recepción no tiene productos asociados.");
                    mensajeCarga.textContent = "⚠️ La recepción no tiene productos asociados.";
                    mensajeCarga.style.color = "orange";
                    return;
                }

                actualizarTablaRecepcion(data.productos);
            } else {
                console.error("❌ Error en la API:", data);
                mensajeCarga.textContent = data.error || "❌ Error al cargar la recepción.";
                mensajeCarga.style.color = "red";
            }
        } catch (error) {
            console.error("❌ Error al cargar la recepción:", error);
            mensajeCarga.textContent = "❌ No se pudo conectar con el servidor.";
            mensajeCarga.style.color = "red";
        }
    };

    // 📌 Función para actualizar la tabla con los productos de la recepción
    function actualizarTablaRecepcion(productos) {
        console.log("📌 Productos recibidos para actualizar la tabla:", productos); // Depuración

        const tablaBody = document.querySelector("#tabla-recepcion tbody");
        tablaBody.innerHTML = ""; // Limpiar la tabla antes de agregar nuevos datos

        if (!productos.length) {
            console.warn("⚠️ No hay productos asociados a esta recepción.");
            return;
        }

        productos.forEach((producto) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${producto.codigo}</td>
                <td>${producto.codigo_tango}</td>
                <td>${producto.ins_mat_prod}</td>
                <td>${producto.codigo_proveedor}</td>
                <td>${producto.proveedor}</td>
                <td>${producto.nro_lote}</td>
                <td>${producto.fecha_vto}</td>
                <td>${producto.temperatura}</td>
                <td>${producto.cantidad_ingresada}</td>
                <td>${producto.nro_partida_asignada}</td>
            ;`
            tablaBody.appendChild(fila);
        });

        console.log("✅ Tabla de recepción actualizada correctamente.");
    }

});*/ 

async function cargarYMostrarRecepcion() {
    const idRecepcion = document.getElementById("id-recepcion").value.trim();
    const mensaje = document.getElementById("mensaje-carga");
    const tablaProductos = document.querySelector("#tabla-recepcion tbody");
    const tablaDatos = document.querySelector("#fila-datos-recepcion tbody") || document.querySelector("#fila-datos-recepcion");

    if (!idRecepcion) {
        mensaje.textContent = "⚠️ Debe ingresar un ID de recepción.";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = "⏳ Cargando recepción...";

    try {
        const response = await fetch(`/recepcion/${idRecepcion}`);
        const data = await response.json();

        console.log("📌 Respuesta de la API:", data);

        if (response.ok) {
            mensaje.textContent = "✅ Recepción cargada correctamente";
            mensaje.style.color = "green";

            // 🧾 Mostrar datos de la recepción
            tablaDatos.innerHTML = "";
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${data.id}</td>
                <td>${new Date(data.fecha).toLocaleDateString()}</td>
                <td>${data.subproceso}</td>
                <td>${data.codigo_proveedor}</td>
                <td>${data.proveedor}</td>
                <td>
                    ${data.link_FR ? `<a href="${data.link_FR}" target="_blank">${data.link_FR}</a>
                    <button onclick="copiarTexto('${data.link_FR}')" class="btn-clipboard"><i class="fa-solid fa-clipboard"></i></button>` : 'No disponible'}
                </td>
            `;
            tablaDatos.appendChild(fila);

            // 🧪 Mostrar productos
            if (!Array.isArray(data.productos) || data.productos.length === 0) {
                mensaje.textContent = "⚠️ La recepción no tiene productos asociados.";
                mensaje.style.color = "orange";
                return;
            }

            tablaProductos.innerHTML = "";
            data.productos.forEach(producto => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${producto.codigo}</td>
                    <td>${producto.codigo_tango}</td>
                    <td>${producto.ins_mat_prod}</td>
                    <td>${producto.codigo_proveedor}</td>
                    <td>${producto.proveedor}</td>
                    <td>${producto.nro_lote}</td>
                    <td>${producto.fecha_vto}</td>
                    <td>${producto.temperatura ? producto.temperatura + "°C" : "-"}</td>
                    <td>${producto.cantidad_ingresada}</td>
                    <td>${producto.nro_partida_asignada}</td>
                `;
                tablaProductos.appendChild(fila);
            });

        } else {
            mensaje.textContent = data.error || "❌ Error al cargar la recepción.";
            mensaje.style.color = "red";
        }

    } catch (error) {
        console.error("❌ Error al cargar la recepción:", error);
        mensaje.textContent = "❌ No se pudo conectar con el servidor.";
        mensaje.style.color = "red";
    }
}

function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert("✅ Copiado al portapapeles");
    });
}
