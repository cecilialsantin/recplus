document.addEventListener("DOMContentLoaded", () => {
    const inputArchivo = document.getElementById("chat-file");
    const resultadoDiv = document.getElementById("resultado-chat");

    inputArchivo.addEventListener("change", async () => {
        const archivo = inputArchivo.files[0];

        if (!archivo || !archivo.name.endsWith(".txt")) {
            resultadoDiv.innerHTML = `<p style="color: red;">⚠️ Seleccioná un archivo .txt válido.</p>`;
            return;
        }

        const formData = new FormData();
        formData.append("chat_file", archivo);

        resultadoDiv.innerHTML = `<p style="color: gray;">⏳ Procesando chat...</p>`;

        try {
            const res = await fetch("/mesa_ayuda/procesar-chat", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                resultadoDiv.innerHTML = `<p style="color: red;">❌ ${data.error}</p>`;
                return;
            }

            resultadoDiv.innerHTML = `
                <h3>✅ Chat procesado:</h3>
                <pre>${JSON.stringify(data, null, 2)}</pre>
                <button onclick="enviarAloyal()" class="btn-ver-recepciones">
                    <i class="fa-solid fa-paper-plane"></i> Automatizar en Loyal
                </button>
            `;
        } catch (err) {
            resultadoDiv.innerHTML = `<p style="color: red;">❌ Error inesperado al procesar</p>`;
        }
    });
});