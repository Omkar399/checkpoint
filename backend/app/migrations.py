"""Lightweight startup migrations.

Project has no migration framework (uses Base.metadata.create_all which doesn't
ALTER existing tables). This module introspects the SQLite schema at startup
and applies idempotent ALTER statements for any columns that have been added
to the ORM models since the last run.

Keep this file boring: each entry should be safe to re-run, and SQLite-only.
"""

from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _column_names(engine: Engine, table: str) -> set[str]:
    insp = inspect(engine)
    return {col["name"] for col in insp.get_columns(table)}


def _add_column_if_missing(
    engine: Engine, table: str, column: str, ddl: str
) -> None:
    try:
        existing = _column_names(engine, table)
    except Exception:
        # Table doesn't exist yet — Base.metadata.create_all will handle it.
        return
    if column in existing:
        return
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))


def run_startup_migrations(engine: Engine) -> None:
    """Apply ad-hoc column additions for SQLite. No-op if columns already exist."""
    if engine.dialect.name != "sqlite":
        return

    # channels.kind — added when introducing numeric/binary/freeform check-in kinds.
    _add_column_if_missing(
        engine, "channels", "kind", "VARCHAR(20) NOT NULL DEFAULT 'numeric'"
    )
    # channels.items — added when introducing the checklist kind.
    # JSON-serialized array of strings; NULL for non-checklist channels.
    _add_column_if_missing(engine, "channels", "items", "TEXT")
    # checkins.checked_items — added with the checklist kind.
    # JSON-serialized array of integers (item indices) or NULL.
    _add_column_if_missing(engine, "checkins", "checked_items", "TEXT")
    # checkins.field_states — added with mixed-type checklist items.
    # JSON-serialized array of {idx, checked?, value?} entries or NULL.
    _add_column_if_missing(engine, "checkins", "field_states", "TEXT")
