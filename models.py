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

class ProductoBase(db.Model):
    __tablename__ = 'productos_base'
    codigo_base = db.Column(db.String(20), primary_key=True)  # Código de barras base
    codigo_tango = db.Column(db.String(20),nullable=False)
    ins_mat_prod = db.Column(db.String(255), nullable=False)  # INS/MAT/PROD
    proveedor = db.Column(db.String(255), nullable=False)  # Proveedor asociado
    cat_partida = db.Column(db.String(20), nullable=True) # categoria de la partida
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relación con Producto (para validaciones futuras si es necesario)
    productos = db.relationship('Producto', backref='producto_base', lazy=True)

# 📌 Modelo para Productos (Se escanean primero, antes de asociarlos a una Recepción)
class Producto(db.Model):
    __tablename__ = 'productos'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # 🔹 Usar ID único
    codigo = db.Column(db.String(50), nullable=False)  
    codigo_tango = db.Column(db.String(20),nullable=False) #codigo_tango viene de productoBase
    ins_mat_prod = db.Column(db.String(255), nullable=False)  # INS/MAT/PROD viene de ProductoBase
    proveedor = db.Column(db.String(255), nullable=False)  # Se obtiene de ProductoBase
    nro_lote = db.Column(db.String(50), nullable=False)
    fecha_vto = db.Column(db.Date, nullable=False)
    temperatura = db.Column(db.Float, nullable=True)
    cantidad_ingresada = db.Column(db.Integer, nullable=False)
    nro_partida_asignada = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relación con ProductoBase
    codigo_base = db.Column(db.String(20), db.ForeignKey('productos_base.codigo_base'), nullable=False)

    # ✅ Clave foránea a Recepcion (cada producto tiene UNA recepción)
    recepcion_id = db.Column(db.Integer, db.ForeignKey('recepciones.id'), nullable=True)

# 📌 Modelo para la Recepción del Producto (Se crean y asocian productos escaneados)
class Recepcion(db.Model):
    __tablename__ = 'recepciones'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    fecha = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    subproceso = db.Column(db.String(100), nullable=False)
    proveedor = db.Column(db.String(255), nullable=False)

     # ✅ Relación uno a muchos (una recepción tiene muchos productos)
    productos = db.relationship('Producto', backref='recepcion', lazy=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
