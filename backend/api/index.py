try:
    from backend.app.main import app  # noqa: F401
except ModuleNotFoundError:  # Vercel project root can be backend/.
    from app.main import app  # noqa: F401
