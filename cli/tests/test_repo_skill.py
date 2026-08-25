import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SKILL_PATH = REPO_ROOT / "cli" / "skills" / "autumn-cli"
SKILL_MD = SKILL_PATH / "SKILL.md"
ANTHROPIC_QUICK_VALIDATE = (
    Path.home()
    / ".codex"
    / "skills"
    / "anthropic-skill-creator"
    / "scripts"
    / "quick_validate.py"
)


def test_repo_ships_autumn_cli_skill():
    assert SKILL_MD.exists()


def test_autumn_skill_passes_anthropic_quick_validate():
    if ANTHROPIC_QUICK_VALIDATE.exists():
        result = subprocess.run(
            [
                "uv",
                "run",
                "--with",
                "pyyaml",
                "python3",
                str(ANTHROPIC_QUICK_VALIDATE),
                str(SKILL_PATH),
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        assert result.returncode == 0, result.stdout + result.stderr
        assert "Skill is valid!" in result.stdout
        return

    content = SKILL_MD.read_text()
    assert content.startswith("---")
    _, frontmatter_text, _ = content.split("---", 2)
    assert "name: autumn-cli" in frontmatter_text
    assert "description:" in frontmatter_text


def test_autumn_skill_mentions_json_profiles_and_admin_safety():
    content = SKILL_MD.read_text()

    assert "prefer `--json`" in content
    assert "prefer explicit `--profile`" in content
    assert "admin" in content.lower()
    assert "Use only when you need privileged access." in content


def test_autumn_skill_covers_auth_statuses_dashboard_and_import_safety():
    content = SKILL_MD.read_text()

    assert "autumn --json auth status" in content
    assert "autumn --json auth doctor" in content
    assert "autumn --json dashboard summary" in content
    assert "autumn --json statuses list" in content
    assert "autumn import validate" in content
    assert "autumn import run" in content


def test_autumn_skill_covers_round_and_document_recipes():
    content = SKILL_MD.read_text()

    assert "autumn job-leads convert" in content
    assert "autumn applications cv url" in content
    assert "autumn rounds media upload" in content
    assert "autumn rounds transcript upload" in content
    assert "server-backed data/actions" in content
