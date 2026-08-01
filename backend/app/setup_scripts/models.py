from typing import Literal

from pydantic import BaseModel, field_validator, model_validator

from app.domain.models import OperatingSystem


class SetupScriptPreview(BaseModel):
    employee_id: str
    operating_system: OperatingSystem
    shell: Literal["powershell"] = "powershell"
    filename: str
    software_ids: list[str]
    executable_commands: list[str]
    manual_steps: list[str]
    content: str
    requires_human_review: Literal[True] = True
    auto_execute: Literal[False] = False

    @field_validator("employee_id")
    @classmethod
    def employee_id_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("employee_id must not be blank")
        return value

    @field_validator("filename")
    @classmethod
    def filename_must_be_safe_powershell_name(cls, value: str) -> str:
        if not value.endswith(".ps1"):
            raise ValueError("filename must end with .ps1")
        if "/" in value or "\\" in value:
            raise ValueError("filename must not contain path separators")
        return value

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("content must not be blank")
        return value

    @field_validator("software_ids", "executable_commands")
    @classmethod
    def values_must_not_contain_duplicates(cls, values: list[str]) -> list[str]:
        if len(values) != len(set(values)):
            raise ValueError("values must not contain duplicates")
        return values

    @model_validator(mode="after")
    def review_and_execution_flags_must_stay_safe(self) -> "SetupScriptPreview":
        if self.requires_human_review is not True:
            raise ValueError("requires_human_review must always be true")
        if self.auto_execute is not False:
            raise ValueError("auto_execute must always be false")
        return self
