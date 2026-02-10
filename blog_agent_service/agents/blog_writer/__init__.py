from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

from .graph import app as blog_writer_app

__all__ = ["blog_writer_app"]
