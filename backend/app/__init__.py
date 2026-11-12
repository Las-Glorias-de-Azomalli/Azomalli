from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

from app.config import Config
from app.database import db
from app.swagger import init_swagger

bcrypt = Bcrypt()
jwt = JWTManager()


def create_app(config_object=None):
    app = Flask(__name__)
    app.config.from_object(Config)

    if config_object:
        if isinstance(config_object, dict):
            app.config.update(config_object)
        else:
            app.config.from_object(config_object)

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
    from app.blueprints.orders.routes import orders_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')

    return app
