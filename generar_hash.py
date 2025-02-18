from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def generar_hash(password):
    hash_generado = bcrypt.generate_password_hash(password).decode('utf-8')
    return hash_generado

if __name__ == "__main__":
    password = input("Ingrese la contraseña a hashear: ")
    hash_password = generar_hash(password)
    print("Hash generado:", hash_password)
