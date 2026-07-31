from app.domain.models import (
    AccessLevel,
    CompanyResource,
    KnowledgeDocument,
    OperatingSystem,
    ResourceType,
    RiskLevel,
    RoleDefinition,
    SeniorityLevel,
    SoftwarePackage,
)


ROLE_CATALOG: tuple[RoleDefinition, ...] = (
    RoleDefinition(
        id="software-engineering-intern",
        name="Software Engineering Intern",
        department="Engineering",
        default_team_id="engineering-general",
        seniority=SeniorityLevel.intern,
        description="Entry-level engineering role focused on mentored product work.",
    ),
    RoleDefinition(
        id="backend-junior",
        name="Backend Engineer I",
        department="Engineering",
        default_team_id="backend",
        seniority=SeniorityLevel.junior,
        description="Junior backend role contributing to APIs and service maintenance.",
    ),
    RoleDefinition(
        id="backend-mid",
        name="Backend Engineer II",
        department="Engineering",
        default_team_id="backend",
        seniority=SeniorityLevel.mid,
        description="Mid-level backend role owning service features and reliability work.",
    ),
    RoleDefinition(
        id="backend-senior",
        name="Senior Backend Engineer",
        department="Engineering",
        default_team_id="backend",
        seniority=SeniorityLevel.senior,
        description="Senior backend role leading service design and production readiness.",
    ),
    RoleDefinition(
        id="platform-engineer",
        name="Platform Engineer",
        department="Engineering",
        default_team_id="platform",
        seniority=SeniorityLevel.mid,
        description="Platform role supporting developer infrastructure and deployment systems.",
    ),
)


RESOURCE_CATALOG: tuple[CompanyResource, ...] = (
    CompanyResource(
        id="gitlab-backend-api",
        name="GitLab backend-api repository",
        resource_type=ResourceType.repository,
        risk=RiskLevel.medium,
        available_access_levels=(
            AccessLevel.reporter,
            AccessLevel.developer,
            AccessLevel.maintainer,
        ),
        description="Primary backend API service repository.",
    ),
    CompanyResource(
        id="gitlab-auth-service",
        name="GitLab auth-service repository",
        resource_type=ResourceType.repository,
        risk=RiskLevel.high,
        available_access_levels=(
            AccessLevel.reporter,
            AccessLevel.developer,
            AccessLevel.maintainer,
        ),
        description="Authentication service repository with sensitive security code.",
    ),
    CompanyResource(
        id="gitlab-payments-service",
        name="GitLab payments-service repository",
        resource_type=ResourceType.repository,
        risk=RiskLevel.high,
        available_access_levels=(
            AccessLevel.reporter,
            AccessLevel.developer,
            AccessLevel.maintainer,
        ),
        description="Payment workflow service repository.",
    ),
    CompanyResource(
        id="gitlab-infrastructure",
        name="GitLab infrastructure repository",
        resource_type=ResourceType.repository,
        risk=RiskLevel.high,
        available_access_levels=(
            AccessLevel.reporter,
            AccessLevel.developer,
            AccessLevel.maintainer,
        ),
        description="Infrastructure-as-code repository for platform resources.",
    ),
    CompanyResource(
        id="slack-engineering",
        name="Slack engineering channel",
        resource_type=ResourceType.slack_channel,
        risk=RiskLevel.low,
        available_access_levels=(AccessLevel.member,),
        description="General engineering coordination channel.",
    ),
    CompanyResource(
        id="slack-platform-engineering",
        name="Slack platform-engineering channel",
        resource_type=ResourceType.slack_channel,
        risk=RiskLevel.low,
        available_access_levels=(AccessLevel.member,),
        description="Platform team coordination channel.",
    ),
    CompanyResource(
        id="jira-backend-board",
        name="Jira backend board",
        resource_type=ResourceType.jira_board,
        risk=RiskLevel.medium,
        available_access_levels=(
            AccessLevel.viewer,
            AccessLevel.reporter,
            AccessLevel.member,
        ),
        description="Backend team planning and delivery board.",
    ),
    CompanyResource(
        id="architecture-documentation",
        name="Architecture documentation",
        resource_type=ResourceType.documentation,
        risk=RiskLevel.low,
        available_access_levels=(AccessLevel.viewer,),
        description="Architecture references for core services and platform systems.",
    ),
    CompanyResource(
        id="development-vpn",
        name="Development VPN",
        resource_type=ResourceType.vpn,
        risk=RiskLevel.medium,
        available_access_levels=(AccessLevel.member,),
        description="VPN access for development-only internal systems.",
    ),
    CompanyResource(
        id="production-admin-access",
        name="Production admin access",
        resource_type=ResourceType.privileged_access,
        risk=RiskLevel.critical,
        available_access_levels=(AccessLevel.admin,),
        description="Highly restricted administrative access to production systems.",
    ),
)


SOFTWARE_CATALOG: tuple[SoftwarePackage, ...] = (
    SoftwarePackage(
        id="git",
        name="Git",
        supported_operating_systems=(
            OperatingSystem.windows,
            OperatingSystem.macos,
            OperatingSystem.linux,
        ),
        install_commands={
            OperatingSystem.windows: "winget install --id Git.Git --source winget",
            OperatingSystem.macos: "brew install git",
            OperatingSystem.linux: "apt install git",
        },
        description="Version control client for source code workflows.",
    ),
    SoftwarePackage(
        id="visual-studio-code",
        name="Visual Studio Code",
        supported_operating_systems=(
            OperatingSystem.windows,
            OperatingSystem.macos,
            OperatingSystem.linux,
        ),
        install_commands={
            OperatingSystem.windows: (
                "winget install --id Microsoft.VisualStudioCode --source winget"
            ),
            OperatingSystem.macos: "brew install --cask visual-studio-code",
            OperatingSystem.linux: "apt install code",
        },
        description="Editor for application development.",
    ),
    SoftwarePackage(
        id="docker-desktop",
        name="Docker Desktop",
        supported_operating_systems=(OperatingSystem.windows, OperatingSystem.macos),
        install_commands={
            OperatingSystem.windows: (
                "winget install --id Docker.DockerDesktop --source winget"
            ),
            OperatingSystem.macos: "brew install --cask docker",
        },
        description="Local container runtime for development environments.",
    ),
    SoftwarePackage(
        id="python",
        name="Python",
        supported_operating_systems=(
            OperatingSystem.windows,
            OperatingSystem.macos,
            OperatingSystem.linux,
        ),
        install_commands={
            OperatingSystem.windows: (
                "winget install --id Python.Python.3.14 --source winget"
            ),
            OperatingSystem.macos: "brew install python@3.14",
            OperatingSystem.linux: "apt install python3",
        },
        description="Python runtime for backend development.",
    ),
    SoftwarePackage(
        id="nodejs",
        name="Node.js",
        supported_operating_systems=(
            OperatingSystem.windows,
            OperatingSystem.macos,
            OperatingSystem.linux,
        ),
        install_commands={
            OperatingSystem.windows: (
                "winget install --id OpenJS.NodeJS.LTS --source winget"
            ),
            OperatingSystem.macos: "brew install node",
            OperatingSystem.linux: "apt install nodejs npm",
        },
        description="JavaScript runtime for frontend development.",
    ),
    SoftwarePackage(
        id="postman",
        name="Postman",
        supported_operating_systems=(
            OperatingSystem.windows,
            OperatingSystem.macos,
            OperatingSystem.linux,
        ),
        install_commands={
            OperatingSystem.windows: (
                "winget install --id Postman.Postman --source winget"
            ),
            OperatingSystem.macos: "brew install --cask postman",
            OperatingSystem.linux: "snap install postman",
        },
        description="API client for manual endpoint checks.",
    ),
    SoftwarePackage(
        id="company-vpn-client",
        name="Company VPN Client",
        supported_operating_systems=(
            OperatingSystem.windows,
            OperatingSystem.macos,
            OperatingSystem.linux,
        ),
        install_commands={
            OperatingSystem.windows: (
                "IT approval required before installing Company VPN Client"
            ),
            OperatingSystem.macos: "IT approval required before installing Company VPN Client",
            OperatingSystem.linux: "IT approval required before installing Company VPN Client",
        },
        risk=RiskLevel.medium,
        description="Placeholder VPN client entry gated by IT approval.",
    ),
)


DOCUMENT_CATALOG: tuple[KnowledgeDocument, ...] = (
    KnowledgeDocument(
        id="architecture-overview",
        title="Architecture Overview",
        category="Engineering",
        description="High-level overview of Boardly service boundaries and data flows.",
    ),
    KnowledgeDocument(
        id="api-standards",
        title="API Standards",
        category="Engineering",
        description="Guidelines for designing, documenting, and reviewing APIs.",
    ),
    KnowledgeDocument(
        id="git-workflow",
        title="Git Workflow",
        category="Engineering",
        description="Branching, review, and merge conventions for product repositories.",
    ),
    KnowledgeDocument(
        id="deployment-guide",
        title="Deployment Guide",
        category="Operations",
        description="Standard deployment process and release coordination checklist.",
    ),
    KnowledgeDocument(
        id="security-handbook",
        title="Security Handbook",
        category="Security",
        description="Security expectations for access, secrets, and incident reporting.",
    ),
    KnowledgeDocument(
        id="team-handbook",
        title="Team Handbook",
        category="People",
        description="Team norms, communication expectations, and onboarding references.",
    ),
)
