"""Configuración de fixtures y opciones de ejecución para Playwright en entorno E2E."""
import os
import pytest

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Configura viewport estándar de escritorio y opciones de red."""
    return {
        **browser_context_args,
        "viewport": {
            "width": 1440,
            "height": 900,
        },
        "ignore_https_errors": True,
        "base_url": FRONTEND_URL,
    }


@pytest.fixture(scope="session")
def browser_type_launch_args(browser_type_launch_args):
    """Opciones de lanzamiento del navegador Chromium para ejecución segura en Docker/CI."""
    return {
        **browser_type_launch_args,
        "headless": True,
        "args": [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ],
    }
