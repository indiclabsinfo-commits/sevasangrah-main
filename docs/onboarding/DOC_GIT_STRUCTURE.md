# Git Module Structure & Repository Organization

To support a scalable multi-tenant environment, we use a professional modular structure for our repositories.

## Recommended Repository Architecture: Hybrid Monorepo

We leverage a **monorepo** for core services and **git submodules** for proprietary/optional modules.

### Structure Overview

```text
/sevasangraha-hms (Root)
├── /apps
│   └── /web (Main React Application)
├── /backend (Node.js API)
├── /packages (Shared Libraries)
│   ├── /ui-kit
│   └── /hms-core
├── /modules (Git Submodules)
│   ├── /hms-billing (Private Repo)
│   ├── /hms-pharmacy (Private Repo)
│   └── /hms-lab (Private Repo)
└── gitmodules (Config)
```

## How to Do It: Step-by-Step Setup

### 1. Initial Setup
```bash
# Initialize the main repository
mkdir sevasangraha-hms
cd sevasangraha-hms
git init
```

### 2. Adding a Submodule (For a new Feature)
When you create a new distinct module (e.g., Pharmacy), keep it isolated so we can control access.

```bash
# syntax: git submodule add <repository_url> <path>
git submodule add https://github.com/indiclabs/hms-pharmacy.git modules/hms-pharmacy

# Commit the change
git add .
git commit -m "feat: add pharmacy submodule"
```

### 3. Developer Workflow

**Cloning the Repo:**
New developers must initialize submodules after cloning.
```bash
git clone https://github.com/indiclabs/sevasangraha-hms.git
cd sevasangraha-hms
git submodule update --init --recursive
```

**Updating Submodules:**
To pull the latest changes for all modules:
```bash
git submodule update --remote --merge
```

### 4. Branching Strategy
*   **Main Branch**: `main` (Production-ready code).
*   **Develop Branch**: `develop` (Integration testing).
*   **Feature Branches**: `feat/module-name` (e.g., `feat/opd-registration`).

### 5. Commit Guidelines
*   **Format**: `type(scope): subject`
*   **Example**: `fix(billing): correct gst calculation for medicines`
*   **Frequency**: Push code daily. Commits must not have gaps > 30 days.
