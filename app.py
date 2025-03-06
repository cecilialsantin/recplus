from config import app  # ✅ Solo importamos la app, db ya se inicializó en config.py
import routes  # ✅ Importamos rutas, lo que inicializa los Blueprints

if __name__ == '__main__':
    app.run(debug=True)
