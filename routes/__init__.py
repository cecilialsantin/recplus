from config import app

# Importamos los Blueprints de cada módulo de rutas
from routes.productos_routes import productos_bp
from routes.recepciones_routes import recepciones_bp
from routes.automatizacion_routes import automatizacion_bp
from routes.main_routes import main_bp
from routes.mesa_ayuda_routes import mesa_ayuda_bp

# Registramos los Blueprints en la app
app.register_blueprint(productos_bp)
app.register_blueprint(recepciones_bp)
app.register_blueprint(automatizacion_bp)
app.register_blueprint(main_bp)
app.register_blueprint(mesa_ayuda_bp)
