import argparse
import os
import sys
from pathlib import Path

def seed() -> int:
    parser = argparse.ArgumentParser(description='Initialize demo DSKP rows in a new local SQLite database.')
    parser.add_argument(
        '--init-empty-local-demo',
        action='store_true',
        help='Explicitly allow initialization of the default, empty local SQLite database.',
    )
    args = parser.parse_args()

    if not args.init_empty_local_demo:
        parser.error('No database changes were made. Pass --init-empty-local-demo only for a new local demo database.')

    if os.environ.get('DATABASE_URL'):
        parser.error('Refusing an explicit DATABASE_URL; this script is restricted to its default local SQLite database.')

    backend_root = Path(__file__).resolve().parent
    instance_dir = backend_root / 'instance'
    local_db = instance_dir / 'erph.db'
    if instance_dir.is_symlink() or local_db.is_symlink():
        parser.error('Refusing a symlinked local database path; no rows were read or changed.')

    try:
        local_db.resolve().relative_to(backend_root)
    except ValueError:
        parser.error('Refusing a database path outside the backend directory; no rows were read or changed.')

    if local_db.exists() and local_db.stat().st_size > 0:
        parser.error('Refusing to modify an existing SQLite database. Back up and review it separately; no rows were read or changed.')
    if local_db.exists() and local_db.stat().st_nlink > 1:
        parser.error('Refusing a multiply-linked database file; no rows were read or changed.')

    from app import create_app
    from models import db, DSKPData

    app = create_app()
    with app.app_context():
        if db.session.query(DSKPData).count() != 0:
            parser.error('Refusing to seed a database that already contains DSKP rows.')

        print('Initializing demo DSKP rows in the local SQLite database...')

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
        print('Seed complete: created demo entries for Bahasa Melayu and English.')

    return 0

if __name__ == "__main__":
    sys.exit(seed())
