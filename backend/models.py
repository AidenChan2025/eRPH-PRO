from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, JSON, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

db = SQLAlchemy()

# Enums
class SubmissionStatus(enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    NEEDS_REVISION = "Needs Revision"

class DayOfWeek(enum.Enum):
    SUNDAY = "Sunday"
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"

# Models

class Profile(db.Model):
    """
    Teacher profiles corresponding to users.
    """
    __tablename__ = 'profiles'
    id = Column(Integer, primary_key=True)
    user_id = Column(String(50), unique=True, index=True, nullable=False) # Link to Auth System (Firebase/Auth0)
    name = Column(String(255), nullable=False)
    school_code = Column(String(50), nullable=False)
    grade_levels = Column(JSON) # e.g. ["Form 1", "Form 4"] or ["Tahun 1"]
    options = Column(JSON) # Store UI preferences like "Jawi Support" toggle
    created_at = Column(DateTime, default=datetime.utcnow)
    
    timetables = relationship('Timetable', backref='profile', lazy=True)
    submissions = relationship('WeeklySubmission', backref='profile', lazy=True)

class DSKPData(db.Model):
    """
    Hierarchical DSKP Data (Subject > Grade > Theme > SK > SP).
    Optimization: Use JSON for SK/SP if standard text is too unstructured, 
    but separate columns allow better search.
    """
    __tablename__ = 'dskp_data'
    id = Column(Integer, primary_key=True)
    subject = Column(String(100), index=True, nullable=False)
    grade = Column(String(50), index=True, nullable=False)
    
    # Hierarchy
    theme = Column(Text) # Tema / Bidang
    topic = Column(Text) # Tajuk (optional)
    
    standard_kandungan = Column(Text) # Content Standard (SK)
    standard_pembelajaran = Column(Text) # Learning Standard (SP)
    
    # Metadata for sorting/grouping
    sk_code = Column(String(20)) # e.g. "1.1"
    sp_code = Column(String(20)) # e.g. "1.1.2"

class Timetable(db.Model):
    """
    Smart Timetable logic. 
    Source of truth for Weekly Builder.
    """
    __tablename__ = 'timetable'
    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey('profiles.id'), nullable=False)
    
    day = Column(Enum(DayOfWeek), nullable=False)
    start_time = Column(String(10), nullable=False) # "08:00"
    end_time = Column(String(10), nullable=False)   # "09:00"
    
    subject = Column(String(100), nullable=False)
    class_name = Column(String(100), nullable=False)
    
    # Optional: Link to a specific DSKP subject if strict validation needed
    # dskp_subject_id = ... 

class WeeklySubmission(db.Model):
    """
    Tracks the status of a teacher's weekly RPH.
    """
    __tablename__ = 'weekly_submissions'
    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey('profiles.id'), nullable=False)
    
    year = Column(Integer, nullable=False)
    week_number = Column(Integer, nullable=False)
    
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.DRAFT)
    submitted_at = Column(DateTime)
    approved_at = Column(DateTime)
    approved_by = Column(String(255)) # Admin Name/ID
    
    admin_feedback = Column(Text)
    
    entries = relationship('LessonEntry', backref='submission', lazy=True, cascade="all, delete-orphan")

class LessonEntry(db.Model):
    """
    The actual Daily Lesson Plan entry.
    """
    __tablename__ = 'lesson_entries'
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey('weekly_submissions.id'), nullable=False)
    
    # Link to timetable slot helps preload data
    timetable_slot_id = Column(Integer, ForeignKey('timetable.id'), nullable=True)
    
    date = Column(Date, nullable=False)
    
    # Content
    topic = Column(String(255))
    objective = Column(Text)
    activities = Column(Text) # Rich Text / HTML
    reflection = Column(Text)
    abm = Column(JSON) # Alat Bantu Mengajar
    
    # Selected DSKP (Snapshots or FKs)
    # Storing as JSON snapshot is safer for historical accuracy if DSKP changes
    selected_sk = Column(JSON) 
    selected_sp = Column(JSON)
