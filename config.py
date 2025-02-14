import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv

# 📌 Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__)

# 📌 Configurar la conexión a MySQL usando SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+mysqlconnector://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 📌 Inicializar SQLAlchemy y Migrate
db = SQLAlchemy(app)
migrate = Migrate(app, db)
