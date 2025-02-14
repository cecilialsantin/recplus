from config import app, db  # Importamos la app y la base de datos
import models  # Importamos los modelos para que Flask-Migrate los detecte
import routes  # Importamos las rutas de la API

if __name__ == '__main__':
    app.run(debug=True)
