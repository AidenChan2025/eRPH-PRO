#!/usr/bin/python3
import cgitb
cgitb.enable()

import sys
import os
from sqlalchemy import text

# Ensure we can import app
sys.path.insert(0, os.path.dirname(__file__))

# Import things that might be needed depending on environment
import pymysql

# Database Credentials
db_user = 'erphpro'
db_password = 'Jnj9AP4JieDkQ9A'
db_host = 'localhost'
db_name = 'erphpro'

print("Content-Type: text/plain\n")

try:
    print("Resetting superadmin password via direct MySQL connection...")
    conn = pymysql.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        database=db_name
    )
    with conn.cursor() as cursor:
        sql = "UPDATE users SET password_hash = %s WHERE email = %s"
        cursor.execute(sql, ('123456', 'cchoong2020@gmail.com'))
        conn.commit()
        if cursor.rowcount > 0:
            print(f"SUCCESS: Password for cchoong2020@gmail.com has been updated to '123456'.")
        else:
            print("ERROR: User 'cchoong2020@gmail.com' not found or password already set to '123456'.")
    conn.close()
            
except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
