
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

async function simularEnvioLoyal() {
    const id = document.getElementById("id-recepcion").value.trim();
    const mensaje = document.getElementById("mensaje-carga");
    const div = document.getElementById("resultado-envio");

    if (!id) return alert("⚠️ Ingrese un ID válido");

    mensaje.textContent = "⏳ Simulando envío a Loyal...";
    mensaje.style.color = "gray";
    div.innerHTML = "";

    try {
        const res = await fetch(`/automatizacion/enviar-loyal/${id}?dry_run=true`, { method: "POST" });
        const data = await res.json();

        if (data.error) {
            mensaje.textContent = `❌ ${data.error}`;
            mensaje.style.color = "red";
            return;
        }

        if (!res.ok) throw new Error(data.error || "Error inesperado");

        mensaje.textContent = "✅ Simulación completada.";
        mensaje.style.color = "green";

        div.innerHTML = `
        <h3>Estás por enviar a Loyal los siguientes productos</h3>
        <table class="tabla-simulacion">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${data.resultados.map(r => `
                    <tr>
                        <td>
                            <strong>${r.authorId} - ${r.ins_mat_prod}</strong><br>
                            <small style="color: #666;">Código: ${r.codigo} · Partida: ${r.nro_partida_asignada}</small>
                        </td>
                        <td style="color: orange; font-weight: bold;">${r.status}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
    

        document.getElementById("btn-confirmar").style.display = "inline-block";

        agregarAlHistorial(data, id, "Simulación");


    } catch (error) {
        mensaje.textContent = `❌ ${error.message}`;
        mensaje.style.color = "red";
    }
}

async function confirmarEnvioLoyal() {
    const id = document.getElementById("id-recepcion").value.trim();
    const mensaje = document.getElementById("mensaje-carga");
    const div = document.getElementById("resultado-envio");

    if (!id) return alert("⚠️ Ingrese un ID válido");

    mensaje.textContent = "⏳ Enviando a Loyal...";
    mensaje.style.color = "gray";
    div.innerHTML = "";

    try {
        const res = await fetch(`/automatizacion/enviar-loyal/${id}?dry_run=false`, { method: "POST" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Error inesperado");

        mensaje.textContent = "✅ Envío finalizado.";
        mensaje.style.color = "green";
        div.innerHTML = `<h4>✅ Se crearon los siguientes formularios:</h4>`;
      let html = `
<h4 style="color:green;">✅ Se crearon los siguientes formularios:</h4>
<table style="border-collapse: collapse; width: 100%;">
    <thead style="background-color: #d0e9c6;">
        <tr>
            <th style="border: 1px solid #ccc;">Recepción_ID</th>
            <th style="border: 1px solid #ccc;">Código</th>
            <th style="border: 1px solid #ccc;">Producto</th>
            <th style="border: 1px solid #ccc;">Partida</th>
            <th style="border: 1px solid #ccc;">Estado</th>
        </tr>
    </thead>
    <tbody>
`;

data.resultados.forEach(r => {
    const color = r.status === "CREADO" ? "green" : "red";
    html += `
        <tr>
            <td style="border: 1px solid #ccc;">${id}</td>
            <td style="border: 1px solid #ccc;">${r.codigo || '-'}</td>
            <td style="border: 1px solid #ccc;">${r.ins_mat_prod || '-'}</td>
            <td style="border: 1px solid #ccc;">${r.nro_partida_asignada || '-'}</td>
            <td style="border: 1px solid #ccc; color:${color}; font-weight:bold;">${r.status}</td>
        </tr>
    `;
});

html += '</tbody></table>';
div.innerHTML = html;

        
        // ✅ Deshabilitar el botón
        document.getElementById("btn-confirmar").disabled = true;
        document.getElementById("btn-confirmar").innerText = "✅ Envío Confirmado";
        agregarAlHistorial(data, id, "Envío");


    } catch (error) {
        mensaje.textContent = `❌ ${error.message}`;
        mensaje.style.color = "red";
    }
}
// 📌 Log de historial
function agregarAlHistorial(data, id, tipo) {
    const log = document.getElementById("log-lista");
    const timestamp = new Date().toLocaleString();
    const total = data.resultados.length;
    const creados = data.resultados.filter(r => r.status === "CREADO").length;

    const li = document.createElement("li");
    li.innerHTML = `📦 <strong>${timestamp}</strong> - ${tipo} recepción <strong>#${id}</strong> → ${creados} / ${total}`;
    log.prepend(li);
}
