from flask_sqlalchemy import SQLAlchemy

# Central SQLAlchemy database instance
# This module provides a single shared instance of SQLAlchemy
# to be imported across the application.
db = SQLAlchemy()
