from enum import Enum


class MarketingPlatform(str, Enum):
    FACEBOOK = "facebook"
    WEBSITE = "website"


class WorkflowStatus(str, Enum):
    PENDING = "pending"
    RETRIEVING_RAG = "retrieving_rag"
    EXTRACTING_FEATURES = "extracting_features"
    GENERATING_CONTENT = "generating_content"
    REVIEWING = "reviewing"
    REVISING = "revising"
    COMPLETED = "completed"
    COMPLETED_WITH_WARNINGS = "completed_with_warnings"
    FAILED = "failed"
