"""Alembic env.py — integrado con la app y sus modelos."""

import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ── Integrar la configuración de Flask ────────────────────────────
from app import create_app
from app.database import db

# Importar todos los modelos para que Alembic los detecte
import app.models  # noqa: F401

flask_app = create_app()

# ── Configuración de Alembic ──────────────────────────────────────
config = context.config

# Inyectar la URL de la BD desde la config de Flask o DATABASE_URL directa
direct_url = os.getenv("DATABASE_URL")
if direct_url:
    if direct_url.startswith("postgresql://"):
        direct_url = direct_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif direct_url.startswith("postgres://"):
        direct_url = direct_url.replace("postgres://", "postgresql+psycopg://", 1)
    migration_url = direct_url
else:
    migration_url = flask_app.config["SQLALCHEMY_DATABASE_URI"]

config.set_main_option(
    "sqlalchemy.url",
    migration_url,
)

# Configurar logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata del modelo (para autogenerate)
target_metadata = db.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
