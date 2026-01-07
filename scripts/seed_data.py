
import uuid
import random
import datetime

# Configuration
# Users to seed data for
USERS = [
    {'id': 'u-cch', 'name': 'Chan Cheng Hoong', 'school_id': 's-1'},
    {'id': 'u-admin', 'name': 'Lee Wei Kang', 'school_id': 's-1'},
    {'id': 'u-principal', 'name': 'Tan Mei Ling', 'school_id': 's-1'},
    {'id': 'u-teacher', 'name': 'Wong Siew Min', 'school_id': 's-1'}
]

SUBJECTS = ['Mathematics', 'Science', 'English', 'Bahasa Melayu', 'History']
CLASSES = ['1 Anggerik', '2 Bestari', '3 Cemerlang', '4 Dedikasi', '5 Efektif']
START_DATE = datetime.date(2026, 1, 1)
END_DATE = datetime.date(2026, 3, 31)

def generate_sql():
    sql_statements = []
    
    current_date = START_DATE
    while current_date <= END_DATE:
        # Skip weekends (Friday/Saturday for Johor/Kedah/Kelantan/Terengganu? Assuming Mon-Fri for general demo)
        # Let's assume Mon-Fri school week
        if current_date.weekday() < 5: 
            for user in USERS:
                # Generate 1-2 plans per day per user
                num_plans = random.randint(1, 2)
                for _ in range(num_plans):
                    plan_id = f"lp-{uuid.uuid4().hex[:8]}"
                    subject = random.choice(SUBJECTS)
                    cls = random.choice(CLASSES)
                    topic = f"Chapter {random.randint(1, 10)}: Introducion to {subject}"
                    
                    # Create SQL Insert
                    # Note: We are using simple string formatting. In production, use parameterized queries.
                    # Since this is a seed script for a known environment, it's acceptable.
                    
                    sql = f"""
                    INSERT INTO lesson_plans (
                        id, school_id, teacher_id, teacher_name, 
                        subject, grade, class_name, time, topic, date, 
                        status, objectives, success_criteria, activities, 
                        updated_at, version
                    ) VALUES (
                        '{plan_id}', '{user['school_id']}', '{user['id']}', '{user['name']}',
                        '{subject}', 'Form {random.randint(1,5)}', '{cls}', '08:00 - 09:00', '{topic}', '{current_date}',
                        'Submitted', '["Understand basic concepts", "Apply formulas"]', '["Score 80% in quiz"]', '["Induction", "Activity 1", "Closure"]',
                        NOW(), 1
                    );
                    """
                    sql_statements.append(sql.strip())
        
        current_date += datetime.timedelta(days=1)

    # Write to file
    with open('seed_rph_2026.sql', 'w') as f:
        f.write('\n'.join(sql_statements))
    
    print(f"Generated {len(sql_statements)} lesson plans in seed_rph_2026.sql")

if __name__ == '__main__':
    generate_sql()
