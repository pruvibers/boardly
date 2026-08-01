from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


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
    demo_summary_received: dict[str, bool] = Field(default_factory=dict)
    demo_acknowledgment_signer_names: dict[str, str] = Field(
        default_factory=dict
    )
    software_confirmations: dict[str, bool] = Field(default_factory=dict)
    demo_it_tickets: dict[str, DemoItTicket] = Field(default_factory=dict)
    setup_preview_generated: bool = False

    @model_validator(mode="before")
    @classmethod
    def migrate_legacy_document_receipt_state(cls, value: object) -> object:
        if not isinstance(value, dict):
            return value
        payload = dict(value)
        legacy_receipts = payload.pop("document_receipt_state", None)
        if legacy_receipts is None:
            return payload
        current_receipts = payload.get("demo_summary_received")
        if current_receipts is None:
            payload["demo_summary_received"] = legacy_receipts
        elif isinstance(legacy_receipts, dict) and isinstance(
            current_receipts, dict
        ):
            payload["demo_summary_received"] = {
                **legacy_receipts,
                **current_receipts,
            }
        return payload

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

    @model_validator(mode="after")
    def signed_documents_are_reviewed(self) -> "PersistedDemoState":
        for document_id in self.demo_acknowledgment_signer_names:
            self.document_review_state[document_id] = True
        return self
