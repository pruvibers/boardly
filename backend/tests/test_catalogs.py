from pydantic import BaseModel

from app.domain.catalogs import (
    DOCUMENT_CATALOG,
    RESOURCE_CATALOG,
    ROLE_CATALOG,
    SOFTWARE_CATALOG,
)
from app.domain.models import (
    AccessLevel,
    CompanyResource,
    KnowledgeDocument,
    ResourceType,
    RiskLevel,
    RoleDefinition,
    SoftwarePackage,
)


def assert_unique_ids(catalog: tuple[BaseModel, ...]) -> None:
    ids = [item.id for item in catalog]

    assert len(ids) == len(set(ids))


def test_all_catalog_ids_are_unique_within_catalogs() -> None:
    assert_unique_ids(ROLE_CATALOG)
    assert_unique_ids(RESOURCE_CATALOG)
    assert_unique_ids(SOFTWARE_CATALOG)
    assert_unique_ids(DOCUMENT_CATALOG)


def test_exactly_five_roles_exist() -> None:
    assert len(ROLE_CATALOG) == 5


def test_production_admin_is_critical_privileged_access() -> None:
    production_admin = next(
        resource
        for resource in RESOURCE_CATALOG
        if resource.id == "production-admin-access"
    )

    assert production_admin.resource_type is ResourceType.privileged_access
    assert production_admin.risk is RiskLevel.critical
    assert production_admin.available_access_levels == (AccessLevel.admin,)


def test_software_install_command_operating_systems_are_supported() -> None:
    for software in SOFTWARE_CATALOG:
        supported_operating_systems = set(software.supported_operating_systems)

        assert set(software.install_commands).issubset(supported_operating_systems)


def test_software_install_commands_do_not_contain_obvious_secret_markers() -> None:
    secret_markers = ("password=", "token=", "api_key=")

    for software in SOFTWARE_CATALOG:
        for command in software.install_commands.values():
            normalized_command = command.lower()

            assert all(marker not in normalized_command for marker in secret_markers)


def test_catalogs_contain_expected_pydantic_model_instances() -> None:
    assert all(isinstance(role, RoleDefinition) for role in ROLE_CATALOG)
    assert all(isinstance(resource, CompanyResource) for resource in RESOURCE_CATALOG)
    assert all(isinstance(software, SoftwarePackage) for software in SOFTWARE_CATALOG)
    assert all(isinstance(document, KnowledgeDocument) for document in DOCUMENT_CATALOG)
