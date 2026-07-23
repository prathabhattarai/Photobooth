import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import settings


def _make_engine():
    url = settings.DATABASE_URL
    kwargs = {"pool_pre_ping": True, "pool_recycle": 3600}
    if "tidbcloud.com" in url:
        kwargs["connect_args"] = {"ssl": {"fake_flag_to_enable_tls": True}}
    return create_engine(url, **kwargs)


engine = _make_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
