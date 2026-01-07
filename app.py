from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, Date, Text, ForeignKey, Enum, or_
from werkzeug.utils import secure_filename
import os
import uuid
import datetime

# For SQLAlchemy 1.4 compatibility
db = SQLAlchemy()
app = Flask(__name__)

# Database Configuration
DB_USER = os.environ.get('DB_USER', 'erphpro')
DB_PASS = os.environ.get('DB_PASS', 'Jnj9AP4JieDkQ9A')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'erphpro')

app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}?charset=utf8mb4"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db.init_app(app)

# --- Models ---

class User(db.Model):
    __tablename__ = 'users'
    id = Column(String(50), primary_key=True)
    school_id = Column(String(50), index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(50), nullable=False)
    password_hash = Column(String(255))
    avatar = Column(String(255))
    phone = Column(String(20))
    grade = Column(String(50))
    signature_url = Column(String(255))
    dashboard_config = Column(JSON)
    security_config = Column(JSON)
    google_token = Column(JSON) # Stores OAuth credentials
    bio = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class School(db.Model):
    __tablename__ = 'schools'
    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    district = Column(String(255))
    type = Column(String(50))
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(255))
    logo_url = Column(String(255))
    settings = Column(JSON)

class LessonPlan(db.Model):
    __tablename__ = 'lesson_plans'
    id = Column(String(50), primary_key=True)
    school_id = Column(String(50), index=True)
    teacher_id = Column(String(50), index=True)
    teacher_name = Column(String(255))
    subject = Column(String(255))
    grade = Column(String(50))
    class_name = Column(String(100))
    time = Column(String(50))
    topic = Column(String(255))
    date = Column(Date)
    content_standard = Column(Text)
    learning_standard = Column(Text)
    objectives = Column(JSON)
    success_criteria = Column(JSON)
    activities = Column(JSON)
    teaching_aids = Column(JSON)
    pak21 = Column(JSON)
    assessment = Column(JSON)
    reflection = Column(Text)
    status = Column(String(50), default='Draft')
    version = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    hots = Column(JSON)
    civic_values = Column(String(255))
    full_document = Column(JSON)

class Task(db.Model):
    __tablename__ = 'tasks'
    id = Column(String(50), primary_key=True)
    school_id = Column(String(50), index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    assignee_id = Column(String(50), index=True)
    assignee_name = Column(String(255))
    due_date = Column(DateTime)
    status = Column(String(50), default='Pending')
    priority = Column(String(50), default='Medium')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    assigner_id = Column(String(50))
    assigner_name = Column(String(255))
    recurrence = Column(JSON)

class LeaveRecord(db.Model):
    __tablename__ = 'leave_records'
    id = Column(String(50), primary_key=True)
    school_id = Column(String(50), index=True)
    teacher_id = Column(String(50), index=True)
    teacher_name = Column(String(255))
    type = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    reason = Column(Text)
    location = Column(String(255))
    status = Column(String(50), default='Pending')
    evidence_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DSKPStandard(db.Model):
    __tablename__ = 'dskp_standards'
    id = Column(String(50), primary_key=True)
    school_type = Column(Text)
    subject = Column(Text)
    grade = Column(Text)
    content_standard = Column(Text)
    learning_standard = Column(Text)
    tema_bidang = Column(Text)
    tema = Column(Text)
    tajuk_kemahiran = Column(Text)
    tajuk = Column(Text)

class TimetableTemplate(db.Model):
    __tablename__ = 'timetable_templates'
    id = Column(String(50), primary_key=True)
    teacher_id = Column(String(50), index=True)
    school_id = Column(String(50), index=True)
    name = Column(String(255))
    effective_date = Column(Date)
    is_active = Column(Boolean, default=False)
    slots = Column(JSON)

class ReferenceItem(db.Model):
    __tablename__ = 'reference_items'
    id = Column(String(50), primary_key=True)
    title = Column(String(255))
    description = Column(Text)
    link = Column(String(500))
    source = Column(String(50))
    school_id = Column(String(50), index=True)
    uploaded_by = Column(String(50))
    uploader_name = Column(String(255))
    category = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = Column(String(50), primary_key=True)
    recipient_id = Column(String(50), index=True)
    title = Column(String(255))
    message = Column(Text)
    type = Column(String(50))
    read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class CalendarEvent(db.Model):
    __tablename__ = 'calendar_events'
    id = Column(String(50), primary_key=True)
    school_id = Column(String(50), index=True)
    title = Column(String(255))
    start = Column(DateTime)
    end = Column(DateTime)
    type = Column(String(50))
    group = Column(String(50))
    created_by = Column(String(50))

class Article(db.Model):
    __tablename__ = 'articles'
    id = Column(String(50), primary_key=True)
    title = Column(String(255))
    slug = Column(String(255), unique=True)
    content = Column(Text)
    excerpt = Column(Text)
    author = Column(String(255))
    category = Column(String(100))
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    featured_image = Column(String(500))
    view_count = Column(Integer, default=0)

class SystemSettings(db.Model):
    __tablename__ = 'system_settings'
    id = Column(Integer, primary_key=True)
    google_analytics_id = Column(String(100))
    google_search_console_id = Column(String(100))
    google_adsense_id = Column(String(100))
    smtp_config = Column(JSON)
    cms_config = Column(JSON)

# --- Routes ---

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if user and user.password_hash == password:
        return jsonify({
            'success': True,
            'token': 'mock-jwt-token',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        })
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/auth/profile', methods=['GET'])
def get_profile():
    # Simulate token auth
    user = User.query.first() # Mocking for now
    if user:
        return jsonify({'success': True, 'data': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}})
    return jsonify({'success': False}), 404

@app.route('/api/lesson-plans', methods=['GET', 'POST'])
def lesson_plans():
    if request.method == 'GET':
        teacher_id = request.args.get('teacherId')
        school_id = request.args.get('schoolId')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        query = LessonPlan.query
        if teacher_id: query = query.filter_by(teacher_id=teacher_id)
        if school_id: query = query.filter_by(school_id=school_id)
        
        if start_date: 
            s_dt = datetime.datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(LessonPlan.date >= s_dt)
        if end_date: 
            e_dt = datetime.datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(LessonPlan.date <= e_dt)
            
        plans = query.all()
        return jsonify({'success': True, 'data': [p.full_document for p in plans]})
    
    data = request.json
    p_id = data.get('id', str(uuid.uuid4()))
    plan = LessonPlan.query.get(p_id)
    if not plan:
        plan = LessonPlan(id=p_id)
        db.session.add(plan)
    
    plan.school_id = data.get('schoolId')
    plan.teacher_id = data.get('teacherId')
    plan.teacher_name = data.get('teacherName')
    plan.subject = data.get('subject')
    plan.grade = data.get('grade')
    plan.topic = data.get('topic')
    plan.date = datetime.datetime.strptime(data.get('date'), '%Y-%m-%d').date() if data.get('date') else None
    plan.status = data.get('status', 'Draft')
    plan.full_document = data
    db.session.commit()
    return jsonify({'success': True, 'data': plan.full_document})

@app.route('/api/lesson-plans/<id>', methods=['GET', 'DELETE'])
def lesson_plan_detail(id):
    plan = LessonPlan.query.get(id)
    if not plan: return jsonify({'success': False, 'message': 'Not found'}), 404
    if request.method == 'GET':
        return jsonify({'success': True, 'data': plan.full_document})
    db.session.delete(plan)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/articles', methods=['GET'])
def get_articles():
    articles = Article.query.all()
    return jsonify({'success': True, 'data': [{
        'id': a.id, 'title': a.title, 'slug': a.slug, 'excerpt': a.excerpt,
        'category': a.category, 'publishedAt': a.published_at.isoformat()
    } for a in articles]})

@app.route('/api/articles/<slug>', methods=['GET'])
def get_article(slug):
    article = Article.query.filter_by(slug=slug).first()
    if article:
        article.view_count += 1
        db.session.commit()
        return jsonify({'success': True, 'data': {
            'id': article.id, 'title': article.title, 'content': article.content,
            'author': article.author, 'publishedAt': article.published_at.isoformat()
        }})
    return jsonify({'success': False}), 404

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks_route():
    if request.method == 'GET':
        tasks = Task.query.all()
        return jsonify({'success': True, 'data': [{
            'id': t.id, 'title': t.title, 'status': t.status, 'dueDate': t.due_date.isoformat() if t.due_date else None
        } for t in tasks]})
    # POST implementation...
    return jsonify({'success': True})

@app.route('/api/admin/users', methods=['GET'])
def admin_users():
    school_id = request.args.get('schoolId')
    role = request.args.get('role')
    query = User.query
    if school_id: query = query.filter_by(school_id=school_id)
    if role: query = query.filter_by(role=role)
    
    users = query.all()
    return jsonify({'success': True, 'data': [{
        'id': u.id, 
        'name': u.name, 
        'email': u.email, 
        'role': u.role, 
        'schoolId': u.school_id, 
        'grade': u.grade
    } for u in users]})

@app.route('/api/admin/settings', methods=['GET', 'PUT'])
def admin_settings():
    settings = SystemSettings.query.first()
    if not settings:
        settings = SystemSettings()
        db.session.add(settings)
        db.session.commit()
        
    if request.method == 'GET':
        return jsonify({'success': True, 'data': {'googleAnalyticsId': settings.google_analytics_id}})
    
    data = request.json
    settings.google_analytics_id = data.get('googleAnalyticsId')
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/cms/crawl', methods=['POST'])
def trigger_crawl():
    # Simulate a crawl process
    return jsonify({'success': True, 'message': 'Crawl triggered successfully'})

@app.route('/api/dskp', methods=['GET'])
def get_dskp():
    query = DSKPStandard.query
    
    # Filters
    subject = request.args.get('subject')
    if subject: query = query.filter_by(subject=subject)
    
    grade = request.args.get('grade')
    if grade:
        # Reverse Normalize for DB Filtering
        if grade == 'Pra Sekolah':
            query = query.filter(DSKPStandard.grade.in_(['PRA', 'PRA SEKOLAH', 'PRA BD']))
        elif grade == 'Pemulihan':
            # Filter subjects containing 'Pemulihan' regardless of original grade
            query = query.filter(DSKPStandard.subject.ilike('%pemulihan%'))
        elif grade == 'Pengukuhan':
            query = query.filter(DSKPStandard.grade.ilike('%PENGUKUHAN%'))
        elif grade == 'Kelas Bercantum':
            # Catch all variations of combined classes (containing & or 'bercantum')
            query = query.filter(or_(
                DSKPStandard.grade.like('%&%'),
                DSKPStandard.grade.ilike('%bercantum%')
            ))
        elif grade.startswith('Tahun '):
            # Extract number "Tahun 1" -> "1"
            raw_grade = grade.replace('Tahun ', '')
            query = query.filter_by(grade=raw_grade)
        else:
            # Fallback for exact matches or other formats
            query = query.filter_by(grade=grade)
        
    school_type = request.args.get('schoolType')
    if school_type: 
        # Handle "SR (Sekolah Rendah)" -> "SR" mapping if needed, 
        # but let's assume valid codes are passed or just handle the formatted one.
        # structure endpoint returns 'SR (Sekolah Rendah)' now
        if 'SR' in school_type: query = query.filter_by(school_type='SR')
        elif 'SMK' in school_type: query = query.filter_by(school_type='SMK')
        else: query = query.filter_by(school_type=school_type)
        
    # Search
    search = request.args.get('search')
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(or_(
            DSKPStandard.content_standard.ilike(search_fmt),
            DSKPStandard.learning_standard.ilike(search_fmt),
            DSKPStandard.subject.ilike(search_fmt)
        ))
        
    # Limit results if no filters to prevent massive load? 
    # For now, let's limit to 500 if no search/subject specified to be safe, 
    # but the UI will likely ask for specific things.
    # Actually, let's just return all for now as per requirement (2000 is manageable).
    
    standards = query.all()
    return jsonify({
        'success': True,
        'data': [{
            'id': s.id, 'schoolType': s.school_type, 'subject': s.subject, 'grade': s.grade,
            'contentStandard': s.content_standard, 'learningStandard': s.learning_standard,
            'temaBidang': s.tema_bidang, 'tema': s.tema, 'tajukKemahiran': s.tajuk_kemahiran, 'tajuk': s.tajuk
        } for s in standards]
    })

@app.route('/api/dskp/structure', methods=['GET'])
def get_dskp_structure():
    try:
        results = db.session.query(
            DSKPStandard.school_type,
            DSKPStandard.grade,
            DSKPStandard.subject
        ).distinct().all()
        
        # Structure: { 'SR': { 'Tahun 1': ['BM', 'BI'], ... }, 'SMK': ... }
        structure = {}
        
        def normalize_grade(g_raw):
            if not g_raw: return None
            g = str(g_raw).strip().upper()
            
            # Valid Filters
            if g in ['PRA', 'PRA SEKOLAH', 'PRA BD']: return 'Pra Sekolah'
            if g in ['1', 'TAHUN 1', 'YEAR 1', 'SATU', 'DARJAH 1']: return 'Tahun 1'
            if g in ['2', 'TAHUN 2', 'YEAR 2', 'DUA', 'DARJAH 2']: return 'Tahun 2'
            if g in ['3', 'TAHUN 3', 'YEAR 3', 'TIGA', 'DARJAH 3']: return 'Tahun 3'
            if g in ['4', 'TAHUN 4', 'YEAR 4', 'EMPAT', 'DARJAH 4']: return 'Tahun 4'
            if g in ['5', 'TAHUN 5', 'YEAR 5', 'LIMA', 'DARJAH 5']: return 'Tahun 5'
            if g in ['6', 'TAHUN 6', 'YEAR 6', 'ENAM', 'DARJAH 6']: return 'Tahun 6'
            
            # Kelas Bercantum (Combined Classes)
            if '&' in g or 'BERCANTUM' in g: return 'Kelas Bercantum'
            
            # Pengukuhan (Group 1 PENGUKUHAN, 2 PENGUKUHAN -> Pengukuhan)
            if 'PENGUKUHAN' in g: return 'Pengukuhan'

            # SMK Grades
            if g in ['PERALIHAN']: return 'Peralihan'
            if g in ['TINGKATAN 1', 'FORM 1', 'T1']: return 'Tingkatan 1'
            if g in ['TINGKATAN 2', 'FORM 2', 'T2']: return 'Tingkatan 2'
            if g in ['TINGKATAN 3', 'FORM 3', 'T3']: return 'Tingkatan 3'
            if g in ['TINGKATAN 4', 'FORM 4', 'T4']: return 'Tingkatan 4'
            if g in ['TINGKATAN 5', 'FORM 5', 'T5']: return 'Tingkatan 5'
            
            # Junk Filter
            if len(g) > 20: return None
            
            return g.title()

        def grade_sort_key(g_name):
            # Sort Order: Pra -> Tahun 1-6 -> Kelas Bercantum -> Peralihan -> SMK
            lower = g_name.lower()
            if 'pra' in lower: return 0
            if 'tahun 1' in lower: return 10
            if 'tahun 2' in lower: return 11
            if 'tahun 3' in lower: return 12
            if 'tahun 4' in lower: return 13
            if 'tahun 5' in lower: return 14
            if 'tahun 6' in lower: return 15
            
            if 'kelas bercantum' in lower: return 18
            if 'pemulihan' in lower: return 19
            if 'pengukuhan' in lower: return 19.5
            
            if 'peralihan' in lower: return 20
            if 'tingkatan 1' in lower: return 21
            if 'tingkatan 2' in lower: return 22
            if 'tingkatan 3' in lower: return 23
            if 'tingkatan 4' in lower: return 24
            if 'tingkatan 5' in lower: return 25
            
            return 99 # Others at end

        # Build raw dict first
        temp_structure = {}
        for school_type, grade, subject in results:
            if not school_type: continue
            
            # STRICT FILTER: School Type must be short and resemble SR/SMK
            vals = school_type.strip().upper()
            if vals not in ['SR', 'SMK', 'SK', 'SJKC', 'SJKT']:
                if len(vals) > 5: continue 
                
            # Normalize Name
            sType_Name = 'SR (Sekolah Rendah)' if vals == 'SR' else vals
            if vals == 'SMK': sType_Name = 'SMK (Sekolah Menengah)'
            
            # Special Grouping: Pemulihan (Based on Subject Name)
            if subject and 'PEMULIHAN' in subject.upper():
                nGrade = 'Pemulihan'
            else:
                nGrade = normalize_grade(grade)
            
            if not nGrade: continue # Skip garbage grades
            
            # BLACKLIST RULES (User Requested Filters)
            # Remove "CUTI PERSEKOLAHAN", "PROGRAM KHAS", "GPM"
            # We check both Grade and Subject for these keywords
            check_str = (str(grade) + ' ' + str(subject)).upper()
            if 'CUTI' in check_str or 'PROGRAM KHAS' in check_str or 'GPM' in check_str:
                continue

            if sType_Name not in temp_structure: temp_structure[sType_Name] = {}
            if nGrade not in temp_structure[sType_Name]: temp_structure[sType_Name][nGrade] = set()
            
            # Normalize Subject
            if subject and len(subject) < 50: 
                 temp_structure[sType_Name][nGrade].add(subject)

        # Rebuild with sorted keys
        final_structure = {}
        for sType in sorted(temp_structure.keys()):
            if not temp_structure[sType]: continue
            
            final_structure[sType] = {}
            # Sort grades based on custom key
            sorted_grades = sorted(temp_structure[sType].keys(), key=grade_sort_key)
            for gr in sorted_grades:
                # Sort subjects alphabetically
                final_structure[sType][gr] = sorted(list(temp_structure[sType][gr]))

        return jsonify({
            'success': True, 
            'data': final_structure
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/dskp/sync', methods=['POST'])
def sync_dskp():
    req_data = request.json
    # Support both list (legacy) and dict with mode/data wrapper
    if isinstance(req_data, list):
        items = req_data
        mode = 'replace'
    else:
        items = req_data.get('data', [])
        mode = req_data.get('mode', 'replace')

    if not isinstance(items, list):
        return jsonify({'success': False, 'message': 'Invalid data format'}), 400
    
    try:
        # Only clear if mode is 'replace'
        if mode == 'replace':
            DSKPStandard.query.delete()
            
        count = 0
        batch_size = 100
        # Process in sub-batches to avoid session overflow risks locally
        for i in range(0, len(items), batch_size):
            batch = items[i:i+batch_size]
            for item in batch:
                std = DSKPStandard(
                    id=item.get('id'),
                    school_type=item.get('schoolType'),
                    subject=item.get('subject'),
                    grade=item.get('grade'),
                    content_standard=item.get('contentStandard'),
                    learning_standard=item.get('learningStandard'),
                    tema_bidang=item.get('temaBidang'), # Mapping snake_case
                    tema=item.get('tema'),
                    tajuk_kemahiran=item.get('tajukKemahiran'),
                    tajuk=item.get('tajuk')
                )
                db.session.add(std)
            # Flush periodically if needed, but committing at end of request is safer for atomic batch
        
        db.session.commit()
        return jsonify({'success': True, 'count': len(items), 'mode': mode})
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc() # Print to err log
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/uploads/<path:filename>')
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/users/check', methods=['GET'])
def check_user_email():
    email = request.args.get('email')
    if not email: return jsonify({'success': False, 'message': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({
            'success': True, 
            'exists': True, 
            'user': {'id': user.id, 'name': user.name, 'role': user.role, 'school_id': user.school_id}
        })
    else:
        return jsonify({'success': True, 'exists': False})

@app.route('/api/admin/schools', methods=['POST'])
def create_school():
    try:
        # formData fields
        name = request.form.get('name')
        code = request.form.get('code')
        district = request.form.get('district')
        type_ = request.form.get('type')
        email = request.form.get('email')
        phone = request.form.get('phone')
        address = request.form.get('address')
        admin_email = request.form.get('adminEmail') # New school admin
        
        if not name or not code:
            return jsonify({'success': False, 'message': 'Name and Code are required'}), 400
            
        # Handle Logo
        logo_url = None
        if 'logo' in request.files:
            file = request.files['logo']
            if file.filename:
                filename = secure_filename(f"school_logo_{code}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                logo_url = f"/uploads/{filename}"

        # Create School
        school_id = str(uuid.uuid4())
        new_school = School(
            id=school_id,
            name=name,
            code=code,
            district=district,
            type=type_,
            email=email,
            phone=phone,
            address=address,
            logo_url=logo_url,
            settings={} 
        )
        db.session.add(new_school)
        
        # Handle Admin Logic
        invitation_sent = False
        if admin_email:
            existing_user = User.query.filter_by(email=admin_email).first()
            if existing_user:
                # Assign existing user as SCHOOL_ADMIN for this school
                existing_user.school_id = school_id
                existing_user.role = 'SCHOOL_ADMIN' # Upgrade/Force role
                # Notify user about new assignment (TODO: Email notification)
            else:
                # User doesn't exist, trigger Invitation
                invitation_sent = True
                try:
                    # Import here to avoid circular dependencies if any (though services usually safe)
                    from services.email_service import send_invitation
                    # Generate registration link (mock)
                    reg_link = f"https://erphpro.com/register?email={admin_email}&school={school_id}&role=SCHOOL_ADMIN"
                    send_invitation(admin_email, 'School Admin', name, reg_link)
                    print(f"INVITE: Sent to {admin_email}")
                except Exception as e:
                    print(f"INVITE_FAIL: {str(e)}")

        db.session.commit()
        return jsonify({
            'success': True, 
            'message': 'School created successfully', 
            'invitationSent': invitation_sent,
            'schoolId': school_id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/newsletter/send', methods=['POST'])
def broadcast_newsletter():
    data = request.json
    subject = data.get('subject')
    content_html = data.get('content') # The body text/html
    template = data.get('template', 'modern')
    target_role = data.get('targetRole') # Optional filter
    
    if not subject or not content_html:
        return jsonify({'success': False, 'message': 'Subject and Content are required'}), 400

    try:
        from services.email_service import send_newsletter
        
        query = User.query
        if target_role:
             query = query.filter_by(role=target_role)
             
        users = query.all()
        count = 0
        
        context = {
            'title': subject,
            'content_html': content_html,
            'action_text': data.get('actionText', 'Log In'),
            'action_link': data.get('actionLink', 'https://erphpro.com')
        }
        
        # In production, use Celery/Redis for background tasks
        for user in users:
            if user.email:
                # Basic personalization (could be moved to service)
                send_newsletter(user.email, subject, template, context)
                count += 1
                
        return jsonify({'success': True, 'count': count})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Google Drive Backup Integration ---
import requests
import json
from datetime import datetime

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'PLACEHOLDER_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', 'PLACEHOLDER_SECRET')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

@app.route('/api/auth/google/url', methods=['GET'])
def get_google_auth_url():
    scope = "https://www.googleapis.com/auth/drive.file"
    url = f"{GOOGLE_AUTH_URL}?client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&response_type=code&scope={scope}&access_type=offline&prompt=consent"
    return jsonify({'url': url})

@app.route('/api/auth/google/callback', methods=['POST'])
def google_auth_callback():
    code = request.json.get('code')
    user_id = request.json.get('userId')
    
    if not code or not user_id:
        return jsonify({'success': False, 'message': 'Missing code or userId'}), 400

    data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code'
    }

    try:
        r = requests.post(GOOGLE_TOKEN_URL, data=data)
        token_data = r.json()
        
        if 'error' in token_data:
            return jsonify({'success': False, 'message': token_data.get('error_description')}), 400

        user = User.query.get(user_id)
        if user:
            user.google_token = token_data
            db.session.commit()
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/backup/drive', methods=['POST'])
def backup_to_drive():
    user_id = request.json.get('userId')
    user = User.query.get(user_id)
    
    if not user or not user.google_token:
        return jsonify({'success': False, 'message': 'User not connected to Google Drive'}), 400
        
    # Refresh Token Utility
    def refresh_access_token():
        refresh_token = user.google_token.get('refresh_token')
        if not refresh_token: return None
        
        r = requests.post(GOOGLE_TOKEN_URL, data={
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        })
        new_data = r.json()
        if 'access_token' in new_data:
            user.google_token = {**user.google_token, **new_data}
            db.session.commit()
            return new_data['access_token']
        return None

    access_token = user.google_token.get('access_token')
    
    # 1. Generate HTML Backup Content
    plans = LessonPlan.query.filter_by(teacher_id=user_id).all()
    html_content = f"<html><body><h1>RPH Backup for {user.name}</h1><p>Generated: {datetime.now()}</p><hr/>"
    for p in plans:
        html_content += f"<h3>{p.subject} - {p.date}</h3><p><strong>Topic:</strong> {p.topic}</p><p><strong>Status:</strong> {p.status}</p><hr/>"
    html_content += "</body></html>"
    
    # 2. Upload to Drive
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Simple check if token is valid by listing files (optional), otherwise catch 401 
    
    files_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
    metadata = {
        'name': f'eRPH_Backup_{datetime.now().strftime("%Y-%m-%d")}.html',
        'mimeType': 'text/html'
    }
    
    files = {
        'metadata': ('metadata', json.dumps(metadata), 'application/json'),
        'file': ('file', html_content, 'text/html')
    }
    
    # Retry once on 401
    try:
        r = requests.post(files_url, headers=headers, files=files)
        if r.status_code == 401:
            new_token = refresh_access_token()
            if new_token:
                headers['Authorization'] = f'Bearer {new_token}'
                # Reset file pointer for retry? Multipart form reconstruction needed.
                # Re-construct for simplicity
                files = {
                    'metadata': ('metadata', json.dumps(metadata), 'application/json'),
                    'file': ('file', html_content, 'text/html')
                }
                r = requests.post(files_url, headers=headers, files=files)
            else:
                 return jsonify({'success': False, 'message': 'Session expired. Please reconnect Drive.'}), 401

        if r.status_code == 200:
            return jsonify({'success': True, 'fileId': r.json().get('id')})
        else:
            return jsonify({'success': False, 'message': r.text}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/schools', methods=['GET'])
def get_schools():
    schools = School.query.all()
    return jsonify({
        'success': True, 
        'data': [{
            'id': s.id, 
            'name': s.name, 
            'code': s.code, 
            'district': s.district, 
            'type': s.type
        } for s in schools]
    })

@app.route('/api/tasks/<id>/status', methods=['PATCH'])
def update_task_status(id):
    task = Task.query.get(id)
    if not task: return jsonify({'success': False, 'message': 'Task not found'}), 404
    data = request.json
    task.status = data.get('status', task.status)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/dskp/<int:id>', methods=['PUT', 'DELETE'])
def manage_dskp_item(id):
    try:
        standard = DSKPStandard.query.get(id)
        if not standard:
            return jsonify({'success': False, 'message': 'Standard not found'}), 404
            
        if request.method == 'DELETE':
            db.session.delete(standard)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Standard deleted successfully'})
            
        if request.method == 'PUT':
            data = request.json
            
            # Allow updating main fields
            if 'contentStandard' in data: standard.content_standard = data['contentStandard']
            if 'learningStandard' in data: standard.learning_standard = data['learningStandard']
            
            # Allow updating metadata
            if 'tema' in data: standard.tema = data['tema']
            if 'tajuk' in data: standard.tajuk = data['tajuk']
            if 'temaBidang' in data: standard.tema_bidang = data['temaBidang']
            if 'tajukKemahiran' in data: standard.tajuk_kemahiran = data['tajukKemahiran']
            
            db.session.commit()
            return jsonify({'success': True, 'message': 'Standard updated successfully'})
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/seed_2026', methods=['GET'])
def seed_2026_data():
    try:
        sql_file = 'seed_rph_2026.sql'
        if not os.path.exists(sql_file):
            return jsonify({'success': False, 'message': 'Seed file not found'}), 404
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # Execute raw SQL
        statements = sql_script.split(';')
        with db.engine.connect() as connection:
            for statement in statements:
                if statement.strip():
                    connection.execute(statement) # Using raw execution
        
        return jsonify({'success': True, 'message': 'Database seeded successfully with 2026 data!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/leaves', methods=['GET', 'POST'])
def leaves_route():
    if request.method == 'GET':
        school_id = request.args.get('schoolId')
        teacher_id = request.args.get('teacherId')
        
        query = LeaveRecord.query
        if school_id: query = query.filter_by(school_id=school_id)
        if teacher_id: query = query.filter_by(teacher_id=teacher_id)
        
        # Sort by date desc
        records = query.order_by(LeaveRecord.start_date.desc()).all()
        
        return jsonify({'success': True, 'data': [{
            'id': r.id,
            'schoolId': r.school_id,
            'teacherId': r.teacher_id,
            'teacherName': r.teacher_name,
            'type': r.type,
            'startDate': r.start_date.isoformat() if r.start_date else None,
            'endDate': r.end_date.isoformat() if r.end_date else None,
            'reason': r.reason,
            'location': r.location,
            'status': r.status,
            'createdAt': r.created_at.isoformat() if r.created_at else None
        } for r in records]})

    # POST - Create Record
    data = request.json
    try:
        new_record = LeaveRecord(
            id=data.get('id', str(uuid.uuid4())),
            school_id=data.get('schoolId'),
            teacher_id=data.get('teacherId'),
            teacher_name=data.get('teacherName'),
            type=data.get('type'),
            start_date=datetime.datetime.strptime(data.get('startDate'), '%Y-%m-%d').date() if data.get('startDate') else None,
            end_date=datetime.datetime.strptime(data.get('endDate'), '%Y-%m-%d').date() if data.get('endDate') else None,
            reason=data.get('reason'),
            location=data.get('location'),
            status=data.get('status', 'Pending')
        )
        db.session.add(new_record)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Leave record created'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/leaves/<id>', methods=['DELETE'])
def delete_leave(id):
    try:
        record = LeaveRecord.query.get(id)
        if not record: return jsonify({'success': False, 'message': 'Record not found'}), 404
        db.session.delete(record)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Frontend Serving (SPA Fallback) ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.root_path, 'build', path)):
        return send_from_directory(os.path.join(app.root_path, 'build'), path)
    else:
        return send_from_directory(os.path.join(app.root_path, 'build'), 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
