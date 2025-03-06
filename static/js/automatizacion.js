document.addEventListener("DOMContentLoaded", function () {

    // 📌 Función para iniciar Selenium en el backend
    window.iniciarSelenium = async function () {
        const codigoRecepcion = document.getElementById("id-recepcion").value.trim();
        const mensajeCarga = document.getElementById("mensaje-carga");

        if (!codigoRecepcion) {
            mensajeCarga.textContent = "⚠️ Debe ingresar un ID de recepción.";
            mensajeCarga.style.color = "red";
            return;
        }

        try {
            const response = await fetch("/automatizacion/iniciarSelenium", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codigo: codigoRecepcion })
            });

            const data = await response.json();

            if (response.ok) {
                mensajeCarga.textContent = data.mensaje;
                mensajeCarga.style.color = "green";
            } else {
                mensajeCarga.textContent = data.error || "❌ Error al iniciar la automatización.";
                mensajeCarga.style.color = "red";
            }
        } catch (error) {
            console.error("❌ Error en la automatización:", error);
            mensajeCarga.textContent = "❌ No se pudo conectar con el servidor.";
            mensajeCarga.style.color = "red";
        }
    };

    // 📌 Función para cargar la recepción y mostrar productos en la tabla
    window.cargarRecepcion = async function () {
        const idRecepcion = document.getElementById("id-recepcion").value.trim();
        const mensajeCarga = document.getElementById("mensaje-carga");

        if (!idRecepcion) {
            mensajeCarga.textContent = "⚠️ Debe ingresar un ID de recepción.";
            mensajeCarga.style.color = "red";
            return;
        }

        try {
            const response = await fetch(`/recepcion/${idRecepcion}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();

            if (response.ok) {
                mensajeCarga.textContent = "✅ Recepción cargada correctamente.";
                mensajeCarga.style.color = "green";
                actualizarTablaRecepcion(data.productos);
            } else {
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
        const tablaBody = document.querySelector("#tabla-recepcion tbody");
        tablaBody.innerHTML = ""; // Limpiar la tabla antes de agregar nuevos datos

        productos.forEach((producto) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${producto.codigo}</td>
                <td>${producto.nro_lote}</td>
                <td>${producto.fecha_vto}</td>
                <td>${producto.temperatura}°C</td>
                <td>${producto.cantidad_ingresada}</td>
                <td>${producto.nro_partida_asignada}</td>
            `;
            tablaBody.appendChild(fila);
        });
    }
});
