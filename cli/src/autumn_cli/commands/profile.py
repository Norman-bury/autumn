from pathlib import Path

import typer

from autumn_cli.client import CLIError
from autumn_cli.input import load_model_body
from autumn_cli.models import UserProfileUpdate
from autumn_cli.output import emit_result, exit_for_error
from autumn_cli.state import get_state

app = typer.Typer(help="Read and update the user profile.")


@app.command("get")
def get_profile(ctx: typer.Context) -> None:
    state = get_state(ctx)
    try:
        payload = state.build_client().get_json("/api/profile", auth="api_key")
        emit_result(state, payload)
    except CLIError as exc:
        exit_for_error(state, exc)


@app.command("update")
def update_profile(
    ctx: typer.Context,
    body_file: Path = typer.Option(..., "--body-file", exists=True),
) -> None:
    state = get_state(ctx)
    body = load_model_body(body_file, UserProfileUpdate)
    try:
        payload = state.build_client().put_json(
            "/api/profile", body=body, auth="api_key"
        )
        emit_result(state, payload)
    except CLIError as exc:
        exit_for_error(state, exc)
