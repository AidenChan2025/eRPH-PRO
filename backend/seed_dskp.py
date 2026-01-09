from app import create_app
from models import db, DSKPData

def seed():
    app = create_app()
    with app.app_context():
        print("Seeding DSKP Data...")
        
        # Clear existing
        try:
            db.session.query(DSKPData).delete()
            db.session.commit()
        except:
            pass # Tables might not exist yet, create_app handles creation

        # Sample Data: Bahasa Melayu (Form 1)
        bm_data = [
            {
                "theme": "Kesihatan dan Kebersihan",
                "sk": "1.1 Mendengar, mengenal dan menyebut perkataan",
                "sp": "1.1.1 Mendengar dan mengenal sebutan perkataan",
                "sk_code": "1.1",
                "sp_code": "1.1.1"
            },
            {
                "theme": "Kesihatan dan Kebersihan",
                "sk": "1.2 Mendengar dan memahami perkataan",
                "sp": "1.2.1 Mendengar dan memahami makna perkataan",
                "sk_code": "1.2",
                "sp_code": "1.2.1"
            },
            {
                "theme": "Keselamatan",
                "sk": "2.1 Membaca secara mekanis",
                "sp": "2.1.1 Membaca surat kiriman rasmi dengan sebutan yang betul",
                "sk_code": "2.1",
                "sp_code": "2.1.1"
            }
        ]

        for item in bm_data:
            entry = DSKPData(
                subject="Bahasa Melayu",
                grade="Form 1",
                theme=item["theme"],
                standard_kandungan=item["sk"],
                standard_pembelajaran=item["sp"],
                sk_code=item["sk_code"],
                sp_code=item["sp_code"]
            )
            db.session.add(entry)

        # Sample Data: English (Form 1)
        eng_data = [
            {
                "theme": "Health and Environment",
                "sk": "1.1 Understand meaning in a variety of familiar contexts",
                "sp": "1.1.1 Understand with little or no support the main ideas in simple longer texts",
                "sk_code": "1.1",
                "sp_code": "1.1.1"
            },
            {
                "theme": "Consumerism and Financial Awareness",
                "sk": "2.1 Communicate information, ideas, opinions and feelings",
                "sp": "2.1.1 Ask about and give detailed information about themselves and others",
                "sk_code": "2.1",
                "sp_code": "2.1.1"
            }
        ]

        for item in eng_data:
            entry = DSKPData(
                subject="English",
                grade="Form 1",
                theme=item["theme"],
                standard_kandungan=item["sk"],
                standard_pembelajaran=item["sp"],
                sk_code=item["sk_code"],
                sp_code=item["sp_code"]
            )
            db.session.add(entry)

        db.session.commit()
        print("Seeding Complete: Created DSKP entries for BM and English.")

if __name__ == "__main__":
    seed()
