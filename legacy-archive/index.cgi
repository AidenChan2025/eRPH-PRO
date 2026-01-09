#!/usr/bin/python3
import os
import sys
import cgitb

# Enable debug Output
cgitb.enable(display=1, format='text')

# Ensure we can import app and local libraries
BASE_DIR = os.path.dirname(__file__)
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, 'lib'))

import pymysql
pymysql.install_as_MySQLdb()

try:
    from wsgiref.handlers import CGIHandler
    from app import app as application
    
    if __name__ == '__main__':
        CGIHandler().run(application)

except Exception as e:
    print("Content-Type: text/plain\n")
    print("CRITICAL STARTUP ERROR:")
    import traceback
    traceback.print_exc()
