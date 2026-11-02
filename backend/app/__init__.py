from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.database import db
from app.swagger import init_swagger


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Permitir solicitudes CORS
    CORS(app)

    db.init_app(app)

    # Inicializar interfaz Swagger
    init_swagger(app)

    from app.blueprints.main.routes import main_bp
    from app.blueprints.products.routes import products_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(products_bp, url_prefix='/api/products')

    return app
