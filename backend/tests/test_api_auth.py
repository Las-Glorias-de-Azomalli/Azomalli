import datetime
import pytest
from app.models.persona import Persona
from app.models.cuenta import Cuenta
from app.models.enums import RolDeUsuario


def test_register_missing_fields(client):
    """Verifica que el registro falle si faltan campos obligatorios."""
    res = client.post('/api/auth/register', json={"email": "incompleto@test.com"})
    assert res.status_code == 400
    assert "Campos faltantes" in res.get_json()["error"]


def test_login_missing_credentials(client):
    """Verifica validación de campos vacíos en login."""
    res = client.post('/api/auth/login', json={})
    assert res.status_code == 400


def test_login_invalid_credentials(client):
    """Verifica fallo con 401 si el usuario o contraseña no coinciden."""
    res = client.post('/api/auth/login', json={
        "email": "noexiste@test.com",
        "password": "PasswordInvalido123"
    })
    assert res.status_code == 401
    assert res.get_json()["error"] == "Credenciales inválidas"


def test_profile_requires_jwt_token(client):
    """Verifica que el acceso a /api/auth/profile sin token retorne 401."""
    res = client.get('/api/auth/profile')
    assert res.status_code == 401


def test_full_auth_flow(client, db_session):
    """Flujo completo de registro, login y consulta de perfil con JWT."""
    # 1. Crear Persona base requerida por la relación
    persona = Persona(
        nombre="Erick",
        primer_apellido="Rodriguez",
        fecha_registro=datetime.date.today()
    )
    db_session.add(persona)
    db_session.commit()

    email_test = "erick.test@azomalli.com"
    pass_test = "ClaveSecreta123!"

    # 2. Registrar Cuenta
    res_reg = client.post('/api/auth/register', json={
        "email": email_test,
        "telefono": "9210001122",
        "password": pass_test,
        "persona_id": persona.persona_id
    })
    assert res_reg.status_code == 201

    # 3. Iniciar sesión y obtener JWT
    res_login = client.post('/api/auth/login', json={
        "email": email_test,
        "password": pass_test
    })
    assert res_login.status_code == 200
    login_data = res_login.get_json()
    token = login_data["access_token"]
    assert token is not None

    # 4. Consultar perfil con el token Bearer
    headers = {"Authorization": f"Bearer {token}"}
    res_profile = client.get('/api/auth/profile', headers=headers)
    assert res_profile.status_code == 200
    profile_data = res_profile.get_json()
    assert profile_data["cuenta"]["email"] == email_test

