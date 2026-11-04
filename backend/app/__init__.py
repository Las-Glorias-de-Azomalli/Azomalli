from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

from app.config import Config
from app.database import db
from app.swagger import init_swagger

bcrypt = Bcrypt()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Permitir solicitudes CORS
    CORS(app)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Inicializar interfaz Swagger
    init_swagger(app)

    from app.blueprints.main.routes import main_bp
    from app.blueprints.products.routes import products_bp
    from app.blueprints.auth.routes import auth_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    return app
