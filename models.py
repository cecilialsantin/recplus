from config import db
from flask_login import UserMixin
from flask_bcrypt import Bcrypt
from datetime import datetime, timezone

bcrypt = Bcrypt()

# 📌 Modelo para Usuarios (Autenticación)
from config import db
from flask_login import UserMixin
from flask_bcrypt import Bcrypt
from datetime import datetime, timezone

bcrypt = Bcrypt()

# 📌 Modelo para Usuarios (Autenticación)
class Usuario(db.Model, UserMixin):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), nullable=False)  # Puede ser "admin", "deposito", "garantia"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        """Encripta la contraseña antes de guardarla en la base de datos."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        """Verifica si la contraseña ingresada es correcta."""
        return bcrypt.check_password_hash(self.password_hash, password)


# 📌 Modelo para Productos
class Producto(db.Model):
    __tablename__ = 'productos'
    codigo = db.Column(db.String(20), primary_key=True)  # Código de barras
    nro_lote = db.Column(db.String(50), nullable=False)
    fecha_vto = db.Column(db.Date, nullable=False)
    temperatura = db.Column(db.Float, nullable=True)
    cantidad_ingresada = db.Column(db.Integer, nullable=False)
    nro_partida_asignada = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

# 📌 Modelo para la Recepción del Producto
class Recepcion(db.Model):
    __tablename__ = 'recepciones'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    fecha = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    subproceso = db.Column(db.String(100), nullable=False)  # Seleccionable
    proveedor = db.Column(db.String(255), nullable=False)  # Seleccionable
    ins_mat_prod = db.Column(db.String(255), nullable=False)  # Seleccionable
    producto_codigo = db.Column(db.String(20), db.ForeignKey('productos.codigo'))
    producto = db.relationship('Producto', backref=db.backref('recepciones', lazy=True))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
