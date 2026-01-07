#!/usr/bin/python3
import cgitb
cgitb.enable()

import sys
import os

# Ensure we can import app and local libraries
BASE_DIR = os.path.dirname(__file__)
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, 'lib'))

import pymysql
pymysql.install_as_MySQLdb()
# Set default env vars for local execution if not set
if 'DB_USER' not in os.environ:
    os.environ['DB_USER'] = 'erphpro'
    os.environ['DB_PASS'] = 'Jnj9AP4JieDkQ9A'
    os.environ['DB_HOST'] = 'localhost'
    os.environ['DB_NAME'] = 'erphpro'

try:
    from app import app, db
    
    # Print header only if running as CGI
    if 'GATEWAY_INTERFACE' in os.environ:
        print("Content-Type: text/plain\n")

    print("Checking database schema...")
    
    with app.app_context():
        # db.create_all() will create tables and columns from SQLAlchemy models
        try:
            db.create_all()
            
            # Manual column additions/modifications for existing tables
            engine = db.engine
            inspector = db.inspect(engine)
            columns = [c['name'] for c in inspector.get_columns('dskp_standards')]
            
            # 1. Ensure columns exist
            new_cols = ['tema_bidang', 'tema', 'tajuk_kemahiran', 'tajuk']
            for col in new_cols:
                if col not in columns:
                    try:
                        db.session.execute(f"ALTER TABLE dskp_standards ADD COLUMN {col} TEXT")
                        print(f"Added column {col} to dskp_standards")
                    except Exception as e:
                        print(f"Notice: Could not add column {col}: {e}")

            # Ensure leave_records has evidence_url
            try:
                lr_columns = [c['name'] for c in inspector.get_columns('leave_records')]
                if 'evidence_url' not in lr_columns:
                    db.session.execute("ALTER TABLE leave_records ADD COLUMN evidence_url VARCHAR(500)")
                    print("Added column evidence_url to leave_records")
            except Exception as e:
                print(f"Notice: Could not check/add evidence_url: {e}")
            
            # 2. Force convert to TEXT to avoid "Data too long" errors
            text_cols = ['grade', 'school_type', 'subject', 'content_standard', 'learning_standard', 'tema_bidang', 'tema', 'tajuk_kemahiran', 'tajuk']
            for col in text_cols:
                try:
                    # Check if column needs update (optional, but MySQL allows repeated MODIFY)
                    db.session.execute(f"ALTER TABLE dskp_standards MODIFY COLUMN {col} TEXT")
                    print(f"Modified column {col} to TEXT in dskp_standards")
                except Exception as e:
                    print(f"Notice: Could not modify column {col}: {e}")

                except Exception as e:
                    print(f"Notice: Could not modify column {col}: {e}")

            # 3. Fix Encoding (Support 4-byte UTF-8 like emojis/rare CJK)
            try:
                db.session.execute("ALTER TABLE dskp_standards CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                print("Converted dskp_standards table to utf8mb4")
            except Exception as e:
                print(f"Notice: Could not convert table charset: {e}")

            db.session.commit()
            print("SUCCESS: Ran db.create_all() to ensure tables exist in MySQL.")
        except Exception as e:
            print(f"ERROR: db.create_all() failed: {e}")
            
except Exception as e:
    if 'GATEWAY_INTERFACE' in os.environ:
        print("Content-Type: text/plain\n")
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
