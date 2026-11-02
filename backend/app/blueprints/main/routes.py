from flask import Blueprint, redirect

main_bp = Blueprint('main', __name__)


@main_bp.route('/docs')
@main_bp.route('/apidocs')
def docs_redirect():
    """Redirecciona alias comunes de documentación hacia la raíz con Swagger UI."""
    return redirect('/')
