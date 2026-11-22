import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SOURCE = Path(__file__).resolve().parents[1] / "seed_dskp.py"


class SeedDskpSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.backend = Path(self.temp.name) / "backend"
        self.backend.mkdir()
        self.script = self.backend / "seed_dskp.py"
        shutil.copy2(SOURCE, self.script)
        (self.backend / "app.py").write_text(
            "from contextlib import nullcontext\n"
            "class App:\n"
            "    def app_context(self): return nullcontext(self)\n"
            "def create_app(): return App()\n",
            encoding="utf-8",
        )
        (self.backend / "models.py").write_text(
            "import os\n"
            "class DSKPData:\n"
            "    def __init__(self, **values): self.values = values\n"
            "class Session:\n"
            "    added = 0\n"
            "    def query(self, model): return self\n"
            "    def count(self): return int(os.environ.get('FAKE_DSKP_COUNT', '0'))\n"
            "    def add(self, row): type(self).added += 1\n"
            "    def commit(self): print(f'COMMIT_ADDED={self.added}')\n"
            "class DB: session = Session()\n"
            "db = DB()\n",
            encoding="utf-8",
        )
        self.database = self.backend / "instance" / "erph.db"

    def tearDown(self):
        self.temp.cleanup()

    def run_seed(self, *args, extra_env=None):
        env = os.environ.copy()
        env.pop("DATABASE_URL", None)
        env.pop("FAKE_DSKP_COUNT", None)
        if extra_env:
            env.update(extra_env)
        return subprocess.run(
            [sys.executable, str(self.script), *args],
            capture_output=True,
            text=True,
            env=env,
            check=False,
        )

    def test_requires_explicit_local_demo_flag_without_creating_database(self):
        result = self.run_seed()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("No database changes were made", result.stderr)
        self.assertFalse(self.database.exists())

    def test_refuses_explicit_database_url_before_creating_database(self):
        result = self.run_seed(
            "--init-empty-local-demo",
            extra_env={"DATABASE_URL": "sqlite:////tmp/should-not-be-used.db"},
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Refusing an explicit DATABASE_URL", result.stderr)
        self.assertFalse(self.database.exists())

    def test_refuses_nonempty_local_database_without_changing_it(self):
        self.database.parent.mkdir(parents=True)
        self.database.write_bytes(b"existing local data marker")
        before = hashlib.sha256(self.database.read_bytes()).hexdigest()

        result = self.run_seed("--init-empty-local-demo")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Refusing to modify an existing SQLite database", result.stderr)
        self.assertEqual(before, hashlib.sha256(self.database.read_bytes()).hexdigest())

    def test_refuses_database_symlink_without_changing_its_target(self):
        external = Path(self.temp.name) / "external.db"
        external.touch()
        self.database.parent.mkdir(parents=True)
        self.database.symlink_to(external)

        result = self.run_seed("--init-empty-local-demo")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Refusing a symlinked local database path", result.stderr)
        self.assertEqual(external.stat().st_size, 0)
        self.assertNotIn("COMMIT_ADDED=", result.stdout)

    def test_refuses_symlinked_instance_directory_without_changing_its_target(self):
        external_instance = Path(self.temp.name) / "external-instance"
        external_instance.mkdir()
        external_db = external_instance / "erph.db"
        external_db.touch()
        (self.backend / "instance").symlink_to(external_instance, target_is_directory=True)

        result = self.run_seed("--init-empty-local-demo")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Refusing a symlinked local database path", result.stderr)
        self.assertEqual(external_db.stat().st_size, 0)
        self.assertNotIn("COMMIT_ADDED=", result.stdout)

    def test_refuses_multiply_linked_empty_database_without_changing_it(self):
        external = Path(self.temp.name) / "external.db"
        external.touch()
        self.database.parent.mkdir(parents=True)
        os.link(external, self.database)

        result = self.run_seed("--init-empty-local-demo")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Refusing a multiply-linked database file", result.stderr)
        self.assertEqual(external.stat().st_size, 0)
        self.assertNotIn("COMMIT_ADDED=", result.stdout)

    def test_refuses_empty_file_when_dskp_table_already_has_rows(self):
        self.database.parent.mkdir(parents=True)
        self.database.touch()

        result = self.run_seed(
            "--init-empty-local-demo",
            extra_env={"FAKE_DSKP_COUNT": "1"},
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("already contains DSKP rows", result.stderr)
        self.assertNotIn("COMMIT_ADDED=", result.stdout)

    def test_seeds_only_when_empty_local_database_is_explicitly_selected(self):
        self.database.parent.mkdir(parents=True)
        self.database.touch()

        result = self.run_seed("--init-empty-local-demo")

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("COMMIT_ADDED=5", result.stdout)
        self.assertIn("Seed complete", result.stdout)


if __name__ == "__main__":
    unittest.main()
