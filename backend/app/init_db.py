#!/usr/bin/env python3
"""
Database initialization script
Creates all tables defined in the SQLAlchemy models
"""

import os
import sys
from pathlib import Path

# Add the current directory to the Python path
sys.path.append(str(Path(__file__).parent))

from database import Base, engine

def init_database():
    """Initialize database tables"""
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        print("📊 Created tables:")
        for table_name in Base.metadata.tables.keys():
            print(f"   - {table_name}")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
