"""Verificações básicas da organização do repositório."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ProjectStructureTests(unittest.TestCase):
    def test_application_entrypoint_exists(self):
        self.assertTrue((ROOT / "app.py").is_file())
        self.assertTrue((ROOT / "backend" / "app.py").is_file())

    def test_frontend_assets_are_in_frontend(self):
        self.assertTrue((ROOT / "frontend" / "templates" / "base.html").is_file())
        self.assertTrue((ROOT / "frontend" / "static" / "css" / "style.css").is_file())
        self.assertTrue((ROOT / "frontend" / "static" / "js" / "app.js").is_file())

    def test_backend_is_a_package(self):
        self.assertTrue((ROOT / "backend" / "__init__.py").is_file())
        self.assertTrue((ROOT / "backend" / "routes" / "__init__.py").is_file())
        self.assertTrue((ROOT / "backend" / "services" / "__init__.py").is_file())


if __name__ == "__main__":
    unittest.main()
