from autumn_cli.config import load_config


def test_load_config_prefers_env_base_url(monkeypatch, cli_config_dir):
    monkeypatch.setenv("AUTUMN_BASE_URL", "https://example.test")

    config = load_config(config_dir=cli_config_dir)

    assert config.get_profile("default").base_url == "https://example.test"
