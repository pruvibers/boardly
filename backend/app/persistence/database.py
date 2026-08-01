import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from app.persistence.models import PersistedDemoState
from app.planner.service import PlannedOnboardingResult
from app.setup_scripts.service import generate_setup_script_preview


DEFAULT_DATABASE_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "boardly-demo.sqlite3"
)


class DuplicateWorkEmailError(ValueError):
    """Raised when a normalized work email belongs to another employee."""


class BoardlyDatabase:
    def __init__(self, path: str | Path | None = None) -> None:
        configured_path = path or os.getenv("BOARDLY_DB_PATH")
        self.path = Path(configured_path) if configured_path else DEFAULT_DATABASE_PATH
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS plan_revisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT
                );

                CREATE TABLE IF NOT EXISTS onboarding_plans (
                    employee_id TEXT PRIMARY KEY,
                    work_email TEXT NOT NULL UNIQUE,
                    result_json TEXT NOT NULL,
                    revision_id INTEGER NOT NULL,
                    FOREIGN KEY (revision_id) REFERENCES plan_revisions(id)
                );

                CREATE TABLE IF NOT EXISTS demo_states (
                    employee_id TEXT PRIMARY KEY,
                    state_json TEXT NOT NULL,
                    FOREIGN KEY (employee_id)
                        REFERENCES onboarding_plans(employee_id)
                        ON DELETE CASCADE
                );
                """
            )

    def save_plan(self, result: PlannedOnboardingResult) -> None:
        employee = result.plan.employee
        normalized_email = normalize_work_email(employee.work_email)

        with self.connect() as connection:
            duplicate = connection.execute(
                """
                SELECT employee_id
                FROM onboarding_plans
                WHERE work_email = ? AND employee_id <> ?
                """,
                (normalized_email, employee.employee_id),
            ).fetchone()
            if duplicate is not None:
                raise DuplicateWorkEmailError(
                    "work email is already assigned to another employee"
                )

            revision_cursor = connection.execute(
                "INSERT INTO plan_revisions DEFAULT VALUES"
            )
            revision_id = revision_cursor.lastrowid
            connection.execute(
                """
                INSERT INTO onboarding_plans (
                    employee_id,
                    work_email,
                    result_json,
                    revision_id
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT(employee_id) DO UPDATE SET
                    work_email = excluded.work_email,
                    result_json = excluded.result_json,
                    revision_id = excluded.revision_id
                """,
                (
                    employee.employee_id,
                    normalized_email,
                    result.model_dump_json(),
                    revision_id,
                ),
            )
            connection.execute(
                "DELETE FROM demo_states WHERE employee_id = ?",
                (employee.employee_id,),
            )

    def list_plans(self) -> list[PlannedOnboardingResult]:
        with self.connect() as connection:
            rows = connection.execute(
                """
                SELECT result_json
                FROM onboarding_plans
                ORDER BY revision_id DESC, employee_id ASC
                """
            ).fetchall()
        return [
            PlannedOnboardingResult.model_validate_json(row["result_json"])
            for row in rows
        ]

    def get_plan(self, employee_id: str) -> PlannedOnboardingResult | None:
        with self.connect() as connection:
            row = connection.execute(
                """
                SELECT result_json
                FROM onboarding_plans
                WHERE employee_id = ?
                """,
                (employee_id,),
            ).fetchone()
        if row is None:
            return None
        return PlannedOnboardingResult.model_validate_json(row["result_json"])

    def get_plan_by_email(
        self, work_email: str
    ) -> PlannedOnboardingResult | None:
        normalized_email = normalize_work_email(work_email)
        with self.connect() as connection:
            row = connection.execute(
                """
                SELECT result_json
                FROM onboarding_plans
                WHERE work_email = ?
                """,
                (normalized_email,),
            ).fetchone()
        if row is None:
            return None
        return PlannedOnboardingResult.model_validate_json(row["result_json"])

    def get_demo_state(self, employee_id: str) -> PersistedDemoState | None:
        if self.get_plan(employee_id) is None:
            return None

        with self.connect() as connection:
            row = connection.execute(
                """
                SELECT state_json
                FROM demo_states
                WHERE employee_id = ?
                """,
                (employee_id,),
            ).fetchone()
        if row is None:
            return PersistedDemoState()
        return PersistedDemoState.model_validate_json(row["state_json"])

    def save_demo_state(
        self, employee_id: str, state: PersistedDemoState
    ) -> PersistedDemoState:
        result = self.get_plan(employee_id)
        if result is None:
            raise LookupError("onboarding plan not found")
        validate_demo_state(result, state)

        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO demo_states (employee_id, state_json)
                VALUES (?, ?)
                ON CONFLICT(employee_id) DO UPDATE SET
                    state_json = excluded.state_json
                """,
                (employee_id, state.model_dump_json()),
            )
        return state


def normalize_work_email(work_email: str) -> str:
    return work_email.strip().lower()


def validate_demo_state(
    result: PlannedOnboardingResult, state: PersistedDemoState
) -> None:
    checklist_ids = {item.id for item in result.plan.checklist}
    document_ids = set(result.plan.document_ids)
    software_ids = set(result.plan.software_ids)
    access_resource_ids = {
        recommendation.resource_id
        for recommendation in result.plan.access_recommendations
    } | set(result.plan.repository_ids)

    _validate_keys(
        state.task_completion_overrides,
        checklist_ids,
        "task completion overrides",
    )
    _validate_keys(
        state.document_review_state,
        document_ids,
        "document review state",
    )
    _validate_keys(
        state.demo_summary_received,
        document_ids,
        "demo summary receipt state",
    )
    _validate_keys(
        state.demo_acknowledgment_signer_names,
        document_ids,
        "demo acknowledgment signatures",
    )
    _validate_keys(
        state.software_confirmations,
        software_ids,
        "software confirmations",
    )

    manual_steps: set[str] = set()
    try:
        preview = generate_setup_script_preview(result.plan.employee)
        manual_steps = set(preview.manual_steps)
    except ValueError:
        pass

    for request_key, ticket in state.demo_it_tickets.items():
        if ticket.category == "software":
            valid = any(
                request_key == f"software:{software_id}"
                for software_id in software_ids
            )
        elif ticket.category == "access":
            valid = any(
                request_key == f"access:{resource_id}"
                for resource_id in access_resource_ids
            )
        else:
            valid = any(
                request_key == f"setup:{manual_step}"
                for manual_step in manual_steps
            )
        if not valid:
            raise ValueError(f"invalid {ticket.category} demo ticket request key")


def _validate_keys(
    values: dict[str, object], valid_ids: set[str], label: str
) -> None:
    invalid_ids = set(values) - valid_ids
    if invalid_ids:
        raise ValueError(f"{label} contains invalid IDs")
