//Funciones para administrar ProductosBase
document.addEventListener("DOMContentLoaded", function () {
    cargarProductosBase();

    // Seleccionamos los elementos del formulario
    const formAgregar = document.getElementById("form-agregar-producto");
    const btnMostrarFormulario = document.getElementById("mostrar-formulario");
    const formularioProducto = document.getElementById("formulario-producto");
    const btnCancelar = document.getElementById("cancelar");

    // 📌 Mostrar/Ocultar formulario al presionar "Producto Nuevo"
    if (btnMostrarFormulario && formularioProducto) {
        btnMostrarFormulario.addEventListener("click", function () {
            if (formularioProducto.style.display === "none" || formularioProducto.style.display === "") {
                formularioProducto.style.display = "block";
                btnMostrarFormulario.innerHTML = '<i class="fa-solid fa-square-minus"></i> Cancelar';
            } else {
                formularioProducto.style.display = "none";
                btnMostrarFormulario.innerHTML = '<i class="fa-solid fa-square-plus"></i> Producto Nuevo';
            }
        });
    }

    // 📌 Botón Cancelar: Oculta el formulario
    if (btnCancelar) {
        btnCancelar.addEventListener("click", function () {
            formularioProducto.style.display = "none";
            btnMostrarFormulario.innerHTML = '<i class="fa-solid fa-square-plus"></i> Producto Nuevo';
        });
    }

    // 📌 Manejo del formulario de agregar producto
    if (formAgregar) {
        formAgregar.addEventListener("submit", async function (event) {
            event.preventDefault();

            const codigoBase = document.getElementById("codigo_base").value.trim();
            const codigoTango = document.getElementById("codigo_tango").value.trim();
            const cat_partida = document.getElementById("cat_partida").value.trim();
            const insMatProd = document.getElementById("ins_mat_prod").value.trim();
            const proveedor = document.getElementById("proveedor").value.trim();

            if (!codigoBase || !codigoTango || cat_partida || !insMatProd || !proveedor) {
                alert("⚠️ Todos los campos son obligatorios.");
                return;
            }

            const producto = {
                codigo_base: codigoBase,
                codigo_tango: codigoTango,
                cat_partida: cat_partida,
                ins_mat_prod: insMatProd,
                proveedor: proveedor
            };

            try {
                const response = await fetch("/admin/productosBase/agregar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(producto)
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.mensaje);
                    formAgregar.reset();  // ✅ Resetea el formulario después de agregar
                    formularioProducto.style.display = "none"; // ✅ Oculta el formulario después de agregar
                    btnMostrarFormulario.innerHTML = '<i class="fa-solid fa-square-plus"></i> Producto Nuevo';
                    cargarProductosBase();
                } else {
                    alert(data.error || "❌ Error al agregar producto.");
                }
            } catch (error) {
                console.error("❌ Error al agregar producto:", error);
            }
        });
    }
});


// 📌 Función para cargar la lista de productos base
async function cargarProductosBase() {
    try {
        const response = await fetch("/admin/productosBase/lista");
        
        if (!response.ok) {
            console.error("❌ Error al obtener productos base:", response.status);
            return;
        }

        const productos = await response.json();

        if (productos.error) {
            console.warn("⚠️", productos.error);
            return;
        }

        console.log("📌 Productos obtenidos:", productos); // Debug en consola

        const tabla = document.getElementById("tabla-productosBase");
        tabla.innerHTML = "";  // Limpiar antes de agregar nuevos datos

        productos.forEach(producto => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${producto.codigo_base}</td>
                <td>${producto.codigo_tango}</td>
                <td>${producto.cat_partida}</td>
                <td>${producto.ins_mat_prod}</td>
                <td>${producto.proveedor}</td>
                <td>
                    <button onclick="modificarProductoBase('${producto.codigo_base}')"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="eliminarProductoBase('${producto.codigo_base}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("❌ Error al obtener productos base:", error);
    }
}

// 📌 Función para abrir el formulario de edición de un producto base
async function modificarProductoBase(codigoBase) {
    try {
        // Obtener datos actuales del producto
        const response = await fetch(`/admin/productosBase/detalle/${codigoBase}`);
        const producto = await response.json();

        if (!response.ok || producto.error) {
            alert(producto.error || "❌ Error al obtener datos del producto.");
            return;
        }

        // Precargar los valores en el formulario modal
        document.getElementById("edit_codigo_base").value = producto.codigo_base;
        document.getElementById("edit_codigo_tango").value = producto.codigo_tango;
        document.getElementById("edit_cat_partida").value = producto.cat_partida;
        document.getElementById("edit_ins_mat_prod").value = producto.ins_mat_prod;
        document.getElementById("edit_proveedor").value = producto.proveedor;

        // Guardar el código base original en un atributo data para identificarlo en la actualización
        document.getElementById("form-editar-producto").setAttribute("data-codigo-original", producto.codigo_base);

        // Mostrar el modal de edición
        document.getElementById("modal-editar-producto").style.display = "block";

    } catch (error) {
        console.error("❌ Error al obtener datos del producto:", error);
    }
}

// 📌 Función para actualizar los datos del producto
async function guardarCambiosProductoBase() {
    const form = document.getElementById("form-editar-producto");
    const codigoOriginal = form.getAttribute("data-codigo-original");

    const productoEditado = {
        codigo_base: document.getElementById("edit_codigo_base").value.trim(),
        codigo_tango: document.getElementById("edit_codigo_tango").value.trim(),
        cat_partida: document.getElementById("edit_cat_partida").value.trim(),
        ins_mat_prod: document.getElementById("edit_ins_mat_prod").value.trim(),
        proveedor: document.getElementById("edit_proveedor").value.trim(),
    };

    if (!productoEditado.codigo_base || !productoEditado.codigo_tango || !productoEditado.ins_mat_prod || !productoEditado.proveedor) {
        alert("⚠️ Todos los campos son obligatorios.");
        return;
    }

    try {
        const response = await fetch(`/admin/productosBase/modificar/${codigoOriginal}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productoEditado)
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.mensaje);
            document.getElementById("modal-editar-producto").style.display = "none"; // Cerrar modal
            cargarProductosBase();
        } else {
            alert(data.error || "❌ Error al modificar producto.");
        }
    } catch (error) {
        console.error("❌ Error al modificar producto:", error);
    }
}

// 📌 Función para cerrar el modal de edición
function cerrarModalEdicion() {
    document.getElementById("modal-editar-producto").style.display = "none";
}


// 📌 Función para eliminar un producto base
async function eliminarProductoBase(codigoBase) {
    if (!confirm("⚠️ ¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) {
        return;
    }

    try {
        const response = await fetch(`/admin/productosBase/eliminar/${codigoBase}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.mensaje);
            cargarProductosBase();
        } else {
            alert(data.error || "❌ Error al eliminar producto.");
        }
    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
    }
}


