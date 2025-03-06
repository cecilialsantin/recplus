from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, logout_user, current_user, login_user
from models import Usuario, db

main_bp = Blueprint('main', __name__)

# 📌 Página principal (Login)
@main_bp.route('/')
def index():
    return render_template('index.html')

# 📌 Página de Home después del Login
@main_bp.route('/home')
@login_required
def home():
    return render_template('home.html')

# 📌 Cerrar sesión
@main_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"mensaje": "✅ Sesión cerrada correctamente"})

# 📌 Obtener perfil del usuario autenticado
@main_bp.route('/perfil', methods=['GET'])
@login_required
def perfil():
    return jsonify({"usuario": current_user.username})

# 📌 Página de gestión de usuarios (solo Admin)
@main_bp.route('/admin/usuarios')
@login_required
def gestion_usuarios():
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Acceso denegado"}), 403
    return render_template('usuarios.html')

# 📌 Registrar nuevos usuarios (solo Admin)
@main_bp.route('/admin/register', methods=['POST'])
@login_required
def register():
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Solo el admin puede registrar nuevos usuarios."}), 403

    data = request.json
    username = data.get("username")
    password = data.get("password")
    rol = data.get("rol")

    if not rol or rol not in ["deposito", "garantia"]:
        return jsonify({"error": "⚠️ El rol debe ser 'deposito' o 'garantia'"}), 400

    if Usuario.query.filter_by(username=username).first():
        return jsonify({"error": "⚠️ Este usuario ya existe."}), 400

    nuevo_usuario = Usuario(username=username, rol=rol)
    nuevo_usuario.set_password(password)

    db.session.add(nuevo_usuario)
    db.session.commit()

    return jsonify({"mensaje": "✅ Usuario registrado exitosamente"})

# 📌 Obtener la lista de usuarios
@main_bp.route('/admin/usuarios/lista', methods=['GET'])
@login_required
def obtener_usuarios():
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Acceso denegado"}), 403

    usuarios = Usuario.query.all()
    usuarios_json = [{"username": u.username, "rol": u.rol} for u in usuarios]
    return jsonify(usuarios_json)

# 📌 Eliminar usuario (solo Admin)
@main_bp.route('/admin/usuarios/eliminar/<string:username>', methods=['DELETE'])
@login_required
def eliminar_usuario(username):
    if current_user.rol != "admin":
        return jsonify({"error": "⚠️ Acceso denegado"}), 403

    usuario = Usuario.query.filter_by(username=username).first()
    if not usuario:
        return jsonify({"error": "⚠️ Usuario no encontrado"}), 404

    db.session.delete(usuario)
    db.session.commit()
    
    return jsonify({"mensaje": "✅ Usuario eliminado exitosamente"})

# 📌 Iniciar sesión
@main_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    usuario = Usuario.query.filter_by(username=username).first()

    if not usuario:
        return jsonify({"error": "⚠️ Usuario incorrecto"}), 403

    if not usuario.check_password(password):
        return jsonify({"error": "⚠️ Contraseña incorrecta"}), 401

    login_user(usuario)

    return jsonify({
        "mensaje": "✅ Login exitoso",
        "usuario": usuario.username,
        "rol": usuario.rol
    })
