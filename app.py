from config import app, db  # Importamos la app y la base de datos
from flask_migrate import Migrate  # ✅ Importar Flask-Migrate
import models  # Importamos los modelos para que Flask-Migrate los detecte
import routes  # Importamos las rutas de la API

# 🔥 Inicializar Flask-Migrate
migrate = Migrate(app, db)  # ✅ Faltaba esta línea

if __name__ == '__main__':
    app.run(debug=True)
