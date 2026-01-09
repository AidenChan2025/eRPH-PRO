import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change'
    # Use SQLite by default for easy local dev
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///erph.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
