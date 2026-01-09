#!/usr/bin/python3
import sys
import cgitb
cgitb.enable()

print("Content-Type: text/plain\n")
print(f"Python version: {sys.version}")
print(f"Path: {sys.path}")
