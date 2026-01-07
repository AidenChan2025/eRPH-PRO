#!/usr/bin/python3
import cgitb
cgitb.enable()

import sys
import os
import datetime
import uuid

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
    from app import app, db, User, School, LessonPlan, Notification, Task, Article, ReferenceItem, CalendarEvent, DSKPStandard, SystemSettings
    
    if 'GATEWAY_INTERFACE' in os.environ:
        print("Content-Type: text/plain\n")

    with app.app_context():
        print("Starting comprehensive seeding...")
        db.create_all()
        
        # 1. Seed School
        s1_id = 's-1'
        school = db.session.get(School, s1_id)
        if not school:
            school = School(
                id=s1_id,
                name='SMK Demo School',
                code='DEMO001',
                district='Kuala Lumpur',
                type='SMK',
                settings={
                    'termStartDate': '2024-03-11',
                    'weekendType': 'SatSun',
                    'schoolGroup': 'B'
                }
            )
            db.session.add(school)
            print("Added school.")

        # 2. Seed Users
        MOCK_USERS = [
            {'id': 'u-cch', 'name': 'Chan Cheng Hoong', 'email': 'cchoong2020@gmail.com', 'role': 'SUPER_ADMIN', 'password_hash': 'demo123'},
            {'id': 'u-principal', 'school_id': s1_id, 'name': 'Tan Mei Ling', 'email': 'principal@school.com', 'role': 'PRINCIPAL', 'password_hash': 'demo123'},
            {'id': 'u-teacher', 'school_id': s1_id, 'name': 'Wong Siew Min', 'email': 'teacher@school.com', 'role': 'TEACHER', 'password_hash': 'demo123'}
        ]
        for u in MOCK_USERS:
            existing = db.session.get(User, u['id'])
            if not existing:
                new_user = User(**u)
                db.session.add(new_user)
                print(f"Added user: {u['name']}")

        # 3. Seed Articles
        if not Article.query.first():
            a1 = Article(
                id=str(uuid.uuid4()),
                title='Welcome to eRPH Pro',
                slug='welcome-to-erph-pro',
                content='Welcome to the new digital lesson planning platform for Malaysian teachers.',
                excerpt='A quick introduction to eRPH Pro.',
                author='System Admin',
                category='Announcements'
            )
            db.session.add(a1)
            print("Added article.")

        # 4. Seed DSKP
        if not DSKPStandard.query.first():
            d1 = DSKPStandard(
                id=str(uuid.uuid4()),
                school_type='SMK',
                subject='English',
                grade='Form 1',
                content_standard='1.1 Listening skills',
                learning_standard='1.1.1 Understand with support the main idea in simple phrases and expressions'
            )
            db.session.add(d1)
            print("Added DSKP standard.")

        # 5. Seed System Settings
        if not SystemSettings.query.first():
            ss = SystemSettings(
                google_analytics_id='UA-XXXXX-Y',
                cms_config={'autoCrawlEnabled': True, 'authorName': 'AI Assistant'}
            )
            db.session.add(ss)
            print("Added system settings.")

        # 6. Seed Lesson Plan
        if not LessonPlan.query.first():
            lp = LessonPlan(
                id='lp-demo-1',
                school_id=s1_id,
                teacher_id='u-teacher',
                teacher_name='Wong Siew Min',
                subject='English',
                grade='Form 1',
                topic='Unit 1: New Beginnings',
                date=datetime.date.today(),
                status='Approved',
                full_document={
                    'id': 'lp-demo-1',
                    'subject': 'English',
                    'topic': 'Unit 1: New Beginnings',
                    'date': str(datetime.date.today()),
                    'status': 'Approved'
                }
            )
            db.session.add(lp)
            print("Added lesson plan.")

        # 7. Seed Tasks
        if not Task.query.first():
            t1 = Task(
                id=str(uuid.uuid4()),
                school_id=s1_id,
                title='Submit Academic Record',
                description='Please submit the records for Science Form 4.',
                assignee_id='u-teacher',
                assignee_name='Wong Siew Min',
                due_date=datetime.datetime.now() + datetime.timedelta(days=2),
                status='Pending',
                priority='High'
            )
            db.session.add(t1)
            print("Added task.")

        db.session.commit()
        print("SUCCESS: Comprehensive seeding completed.")
        
except Exception as e:
    if 'GATEWAY_INTERFACE' in os.environ:
        print("Content-Type: text/plain\n")
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
