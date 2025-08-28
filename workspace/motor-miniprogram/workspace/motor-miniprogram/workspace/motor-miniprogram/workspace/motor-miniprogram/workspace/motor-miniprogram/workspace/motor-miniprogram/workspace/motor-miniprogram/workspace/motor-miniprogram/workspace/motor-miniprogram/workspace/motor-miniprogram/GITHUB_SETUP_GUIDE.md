# Motor Projects GitHub Repository Setup and Migration Guide

This guide provides complete automation for migrating Motor Projects to an optimized multi-repository structure with automated CI/CD, shared package management, and cross-repository dependency management.

## 🎯 Overview

The migration transforms the current monolithic structure into a strategic hybrid approach:

- **motor-core** (Monorepo): Backend + Web + Shared libraries + Design system
- **motor-mobile** (Independent): React Native mobile app
- **motor-miniprogram** (Independent): WeChat mini-program
- **motor-crawler** (New): Python data crawling services
- **motor-infrastructure** (New): Infrastructure as Code

## 📋 Prerequisites

### Required Tools
```bash
# Install GitHub CLI
brew install gh  # macOS
# or
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh  # Ubuntu/Debian

# Install git-filter-repo (recommended for better history preservation)
pip install git-filter-repo

# Install jq for JSON manipulation
brew install jq  # macOS
sudo apt install jq  # Ubuntu/Debian
```

### Authentication Setup
```bash
# Authenticate with GitHub
gh auth login

# Configure npm for GitHub Packages
npm login --registry=https://npm.pkg.github.com

# Generate personal access token with these scopes:
# - repo (full repository access)
# - packages:write (GitHub Packages)
# - workflow (GitHub Actions)
# - admin:org (organization management)
```

### Environment Configuration
```bash
# Set your GitHub organization
export GITHUB_ORG="your-org-name"  # Replace with your organization

# Make scripts executable
chmod +x scripts/*.sh
```

## 🚀 Step-by-Step Migration Process

### Step 1: GitHub Repository Setup

Create all repositories with proper configurations, team permissions, and CI/CD workflows:

```bash
# Review and update organization name
# Edit scripts/github-repo-setup.sh if needed

# Run repository setup
./scripts/github-repo-setup.sh
```

This script will:
- ✅ Create 5 repositories with proper settings
- ✅ Set up branch protection rules
- ✅ Configure team permissions and access
- ✅ Create project boards for sprint management
- ✅ Generate repository-specific CI/CD workflows
- ✅ Set up security scanning and automated testing

**Expected output:**
```
[SUCCESS] Created repository: motor-core
[SUCCESS] Created repository: motor-mobile
[SUCCESS] Created repository: motor-miniprogram
[SUCCESS] Created repository: motor-crawler
[SUCCESS] Created repository: motor-infrastructure
```

### Step 2: Configure Secrets and Variables

Update the secrets template with your actual values:

```bash
# Copy and edit secrets template
cp scripts/github-secrets.env scripts/github-secrets-production.env
nano scripts/github-secrets-production.env

# Update with your actual values:
# - Database URLs
# - API keys
# - Authentication secrets
# - Third-party service credentials
```

### Step 3: Code Migration

Migrate existing code to new repository structure while preserving Git history:

```bash
# Run migration script
./scripts/migrate-repositories.sh
```

This script will:
- ✅ Create complete backup of current state
- ✅ Preserve Git history for all migrated components
- ✅ Create motor-core monorepo with Turbo build system
- ✅ Set up independent repositories for mobile and miniprogram
- ✅ Initialize new crawler and infrastructure repositories
- ✅ Configure cross-repository dependencies
- ✅ Generate comprehensive migration report

**Migration Progress:**
```
[INFO] Creating backup of current state...
[SUCCESS] Backup created at: /path/to/backup
[INFO] Creating motor-core monorepo...
[SUCCESS] Migrated motor-backend to motor-core/apps/backend
[SUCCESS] Migrated motor-web-frontend to motor-core/apps/web
[SUCCESS] Migrated motor-shared to motor-core/packages/shared
[SUCCESS] motor-core monorepo migration completed
```

### Step 4: Verify Migration

Check that all repositories are properly set up:

```bash
# Check repository status
for repo in motor-core motor-mobile motor-miniprogram motor-crawler motor-infrastructure; do
    echo "Checking $repo..."
    gh repo view $GITHUB_ORG/$repo --json name,url,defaultBranch
done

# Verify CI/CD workflows
gh workflow list --repo $GITHUB_ORG/motor-core
```

## 🔧 Development Workflow

### motor-core Monorepo Development

```bash
# Clone motor-core monorepo
git clone git@github.com:$GITHUB_ORG/motor-core.git
cd motor-core

# Install all dependencies
npm install

# Development commands
npm run dev          # Start all development servers
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Lint all packages

# Individual package commands
npm run dev --workspace=@motor-projects/backend
npm run test --workspace=@motor-projects/web
npm run build --workspace=@motor-projects/design-system
```

### Independent Repository Development

```bash
# Clone mobile app
git clone git@github.com:$GITHUB_ORG/motor-mobile.git
cd motor-mobile
npm install
npm run dev

# Clone miniprogram
git clone git@github.com:$GITHUB_ORG/motor-miniprogram.git
cd motor-miniprogram
npm install
npm run dev
```

## 📦 Shared Package Management

### Publishing Shared Packages

The monorepo includes shared packages that other repositories depend on:

```bash
# Navigate to motor-core repository
cd motor-core

# Check package status
../scripts/shared-package-publisher.sh status

# Publish all packages with patch version bump
../scripts/shared-package-publisher.sh publish-all

# Publish specific package with minor version bump
../scripts/shared-package-publisher.sh publish shared minor

# Force publish without version check
../scripts/shared-package-publisher.sh publish design-system --force
```

### Managing Cross-Repository Dependencies

Keep dependencies synchronized across all repositories:

```bash
# Check dependency status across all repos
./scripts/dependency-management.sh status

# Update all dependencies
./scripts/dependency-management.sh update

# Update dependencies and create pull requests for review
./scripts/dependency-management.sh update --pr

# Validate all repositories after updates
./scripts/dependency-management.sh validate
```

## 🔄 CI/CD Pipeline Overview

### motor-core Monorepo Pipeline

```yaml
# .github/workflows/ci-cd.yml
Trigger: Push/PR to main/develop
├── Detect Changes (determines what to test/build)
├── Parallel Testing
│   ├── Test Shared Libraries
│   ├── Test Backend (with MongoDB/Redis)
│   ├── Test Web Frontend + E2E
│   └── Security Scanning
├── Build & Push Docker Images
├── Deploy to Staging (develop branch)
└── Deploy to Production (main branch)
```

### Independent Repository Pipelines

**motor-mobile:**
- React Native testing and building
- Expo build for development/production
- App store deployment automation

**motor-miniprogram:**
- WeChat miniprogram testing
- Automated upload to WeChat DevTools

**motor-crawler:**
- Python testing with pytest
- Docker image building
- Scheduled crawling jobs

**motor-infrastructure:**
- Terraform validation and planning
- Infrastructure deployment
- Kubernetes manifest validation

## 🛡️ Security and Compliance

### Automated Security Features

- **Code Scanning**: Trivy vulnerability scanner
- **Dependency Scanning**: Automated dependency updates
- **Secret Detection**: GitHub secret scanning
- **Branch Protection**: Required reviews and status checks
- **Security Advisories**: Automated security alerts

### Compliance Features

- **Audit Logs**: Complete Git history preservation
- **Access Control**: Role-based team permissions
- **Change Tracking**: All changes through pull requests
- **Deployment Approvals**: Environment-specific approvals

## 📊 Monitoring and Observability

### Repository Health Monitoring

```bash
# Check all repository statuses
for repo in motor-core motor-mobile motor-miniprogram motor-crawler motor-infrastructure; do
    echo "=== $repo ==="
    gh repo view $GITHUB_ORG/$repo --json name,pushedAt,primaryLanguage
    gh pr list --repo $GITHUB_ORG/$repo --state open
    gh workflow list --repo $GITHUB_ORG/$repo
    echo ""
done
```

### CI/CD Pipeline Monitoring

- **GitHub Actions**: Built-in workflow monitoring
- **Status Badges**: Add to repository READMEs
- **Slack Integration**: Workflow notifications
- **Email Alerts**: Failed deployment notifications

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Issues
```bash
# Re-authenticate with GitHub
gh auth logout
gh auth login

# Check npm authentication
npm whoami --registry=https://npm.pkg.github.com
```

#### 2. Git History Issues
```bash
# If git-filter-repo is not available, install it:
pip install git-filter-repo

# Or use the fallback git filter-branch (slower but works)
# The migration script handles this automatically
```

#### 3. Dependency Resolution Issues
```bash
# Clear all node_modules and reinstall
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
npm install

# Clear npm cache if issues persist
npm cache clean --force
```

#### 4. CI/CD Pipeline Failures
```bash
# Check workflow logs
gh workflow view --repo $GITHUB_ORG/motor-core

# Re-run failed workflows
gh workflow run --repo $GITHUB_ORG/motor-core ci-cd.yml
```

### Getting Help

1. **Check Migration Report**: Review `MIGRATION_REPORT.md` for detailed information
2. **View Logs**: All scripts provide detailed logging with timestamps
3. **Backup Recovery**: Original repository backed up before migration
4. **GitHub Support**: Use GitHub CLI `gh issue create` for repository-specific issues

## 📚 Additional Resources

### Documentation Structure

After migration, each repository will have:

```
repository/
├── README.md                    # Repository overview
├── docs/
│   ├── development.md          # Development setup
│   ├── deployment.md           # Deployment guide
│   ├── api.md                  # API documentation
│   └── contributing.md         # Contribution guidelines
├── .github/
│   ├── workflows/              # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   └── PULL_REQUEST_TEMPLATE/  # PR template
```

### Best Practices

1. **Branch Strategy**: Use `develop` for staging, `main` for production
2. **PR Reviews**: Require at least one review before merging
3. **Testing**: Maintain >80% test coverage
4. **Documentation**: Keep README and docs up to date
5. **Security**: Regular dependency updates and security scans
6. **Monitoring**: Set up alerts for build failures and security issues

### Team Collaboration

- **Code Reviews**: All changes through pull requests
- **Sprint Planning**: Use organization project boards
- **Communication**: Slack integration for notifications
- **Documentation**: Shared knowledge in repository wikis

---

## 🎉 Migration Complete!

After following this guide, you will have:

✅ **5 optimized repositories** with proper structure and configurations  
✅ **Automated CI/CD pipelines** with testing, building, and deployment  
✅ **Shared package management** with automated publishing  
✅ **Cross-repository dependency management** with automated updates  
✅ **Team permissions and security** properly configured  
✅ **Complete Git history preservation** for all migrated code  
✅ **Infrastructure as Code** setup for deployment automation  
✅ **Comprehensive monitoring** and alerting configured

Your development team can now work efficiently with:
- **Faster builds** through monorepo optimization
- **Reliable deployments** through automated CI/CD
- **Consistent dependencies** through automated management  
- **Better collaboration** through proper repository structure
- **Enhanced security** through automated scanning and compliance

**Next Steps:**
1. Train your team on the new workflow
2. Set up development environments
3. Configure deployment environments
4. Start developing with confidence!

The Motor Projects repository structure is now optimized for rapid, reliable development and deployment. Happy coding! 🚀