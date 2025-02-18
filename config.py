import os
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager

# 🔹 Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__)

# 🔹 Configuración de la base de datos usando las variables del .env
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")  # Por defecto usa localhost si no está en el .env
DB_NAME = os.getenv("DB_NAME")

app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 🔹 Cargar la SECRET_KEY desde el .env
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "clave_por_defecto_si_falta")

# 🔥 Inicializar extensiones
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = "index"  # 🔹 Página de login si no está autenticado
login_manager.session_protection = "strong"

# 🔹 Cargar usuario por ID para Flask-Login
from models import Usuario

@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))
