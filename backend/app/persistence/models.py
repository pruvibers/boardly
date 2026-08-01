from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DemoItTicket(BaseModel):
    model_config = ConfigDict(extra="forbid")

    submitted: bool
    category: Literal["software", "access", "setup"]
    subject: str
    description: str
    note: str = ""

    @field_validator("subject", "description")
    @classmethod
    def required_text_must_not_be_blank(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("must not be blank")
        return normalized

    @field_validator("note")
    @classmethod
    def normalize_note(cls, value: str) -> str:
        return value.strip()


class PersistedDemoState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    task_completion_overrides: dict[str, bool] = Field(default_factory=dict)
    document_review_state: dict[str, bool] = Field(default_factory=dict)
    document_receipt_state: dict[str, bool] = Field(default_factory=dict)
    demo_acknowledgment_signer_names: dict[str, str] = Field(
        default_factory=dict
    )
    software_confirmations: dict[str, bool] = Field(default_factory=dict)
    demo_it_tickets: dict[str, DemoItTicket] = Field(default_factory=dict)
    setup_preview_generated: bool = False

    @field_validator("demo_acknowledgment_signer_names")
    @classmethod
    def signer_names_must_not_be_blank(
        cls, values: dict[str, str]
    ) -> dict[str, str]:
        normalized: dict[str, str] = {}
        for document_id, signer_name in values.items():
            stripped_name = signer_name.strip()
            if not stripped_name:
                raise ValueError("demo acknowledgment signer names must not be blank")
            normalized[document_id] = stripped_name
        return normalized
