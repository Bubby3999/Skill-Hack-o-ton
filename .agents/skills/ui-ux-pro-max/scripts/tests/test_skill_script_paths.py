"""Check entrypoints and execute the documented repo-local setup from another cwd."""

import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SKILLS = Path(__file__).resolve().parents[3]
REPO = SKILLS.parent.parent


def documented_setup(path, variable):
    text = path.read_text(encoding="utf-8")
    match = re.search(rf'^export {variable}=.*$', text, re.MULTILINE)
    if match is None:
        raise AssertionError(f"No setup for {variable} in {path}")
    return match.group()


class SkillScriptPathsTest(unittest.TestCase):
    def test_every_bundled_skill_has_an_uppercase_entrypoint(self):
        skills = [path for path in SKILLS.iterdir() if path.is_dir()]
        self.assertTrue(skills)
        for skill in skills:
            with self.subTest(skill=skill.name):
                self.assertIn("SKILL.md", {path.name for path in skill.iterdir()})

    def test_documented_ui_script_paths_exist(self):
        skill = SKILLS / "ui-ux-pro-max"
        text = (skill / "SKILL.md").read_text(encoding="utf-8")
        paths = re.findall(r'python\s+"([^"\n]+\.py)"', text)
        self.assertTrue(paths)
        for path in paths:
            with self.subTest(path=path):
                self.assertTrue(path.startswith("${UI_UX_SKILL_DIR}/"))
                self.assertTrue(Path(path.replace("${UI_UX_SKILL_DIR}", str(skill))).is_file())

    def test_documented_ui_setup_runs_search_from_another_directory(self):
        setup = documented_setup(SKILLS / "ui-ux-pro-max/SKILL.md", "UI_UX_SKILL_DIR")
        with tempfile.TemporaryDirectory() as tmp:
            result = subprocess.run(
                ["bash", "-c", setup + '\ncd "$1"\n"$2" "$UI_UX_SKILL_DIR/scripts/search.py" "keyboard focus modal" --domain ux --json',
                 "skill-path-test", tmp, sys.executable],
                cwd=REPO, capture_output=True, text=True,
            )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertGreater(json.loads(result.stdout)["count"], 0)

    def test_documented_playwright_setup_invokes_the_bundled_wrapper(self):
        for relative in ("SKILL.md", "references/cli.md"):
            with self.subTest(document=relative), tempfile.TemporaryDirectory() as tmp:
                fake_npx = Path(tmp) / "npx"
                fake_npx.write_text('#!/bin/bash\nprintf "%s\\n" "$@"\n', encoding="utf-8")
                fake_npx.chmod(0o755)
                env = dict(os.environ, PATH=tmp + os.pathsep + os.environ.get("PATH", ""))
                setup = documented_setup(SKILLS / "playwright" / relative, "PWCLI")
                result = subprocess.run(
                    ["bash", "-c", setup + '\ncd "$1"\n"$PWCLI" --help', "skill-path-test", tmp],
                    cwd=REPO, env=env, capture_output=True, text=True,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn("@playwright/cli", result.stdout.splitlines())
                self.assertEqual(result.stdout.splitlines()[-1], "--help")


if __name__ == "__main__":
    unittest.main()
