# Issue Importer Action - Setup Guide
This repository contains a complete, production-ready GitHub Action for importing issues from CSV or JSON files. Here's everything you need to know to get started.

## 🚀 Quick Start

### Prerequisites
- Node.js 20 or higher
- npm (comes with Node.js)
- Git

### 1. Repository Structure
```
issue-importer/
├── .github/
│   ├── workflows/
│   │   ├── build-test.yml      # CI/CD pipeline
│   │   └── codeql.yml          # Security analysis
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md       # Bug report template
│   │   └── feature_request.md  # Feature request template
│   └── dependabot.yml          # Dependency updates
├── dist/
│   └── index.js                # Compiled action (auto-generated)
├── examples/
│   ├── sample-issues.csv       # Sample CSV file
│   ├── sample-issues.json      # Sample JSON file
│   └── example-workflow.yml    # Example usage workflow
├── tests/
│   ├── index.test.js          # Unit tests
│   └── setup.js               # Test setup
├── action.yml                 # Action metadata
├── eslint.config.js           # Code style rules (ESLint 9+ format)
├── index.js                   # Main action logic
├── jest.config.js             # Test configuration
├── logo.png                   # Project logo
├── package.json               # Node.js dependencies
├── .gitignore                 # Git ignore rules
├── LICENSE                    # MIT license
├── README.md                  # Main documentation
├── SECURITY.md                # Security policy
└── SETUP.md                   # This setup guide
```

### 2. Installation & Setup
1. **Clone or create repository:**
   ```bash
   git clone https://github.com/dsanchezcr/issue-importer-action
   cd issue-importer-action
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the action:**
   ```bash
   npm run build
   ```
   *This compiles the action into a single file in the `dist/` directory using `@vercel/ncc`*

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Lint code:**
   ```bash
   npm run lint
   ```

## 📝 Usage Examples

### Basic CSV Import
```yaml
name: Import Issues from CSV
on: workflow_dispatch

jobs:
  import:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dsanchezcr/issue-importer-action@v1.0.0
        with:
          file-path: 'issues.csv'
          file-format: 'csv'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### JSON Import with Dry Run
```yaml
name: Import Issues (Dry Run)
on: 
  pull_request:
    paths: ['data/issues.json']

jobs:
  dry-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dsanchezcr/issue-importer-action@v1.0.0
        with:
          file-path: 'data/issues.json'
          file-format: 'json'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          dry-run: 'true'
```

## 📊 Input File Formats

### CSV Format
```csv
title,body,labels,assignees,milestone
"Setup CI/CD Pipeline","We need to setup automated testing and deployment pipeline for the project","enhancement;devops",""
```

### JSON Format
```json
{
  "issues": [
    {
      "title": "Setup CI/CD Pipeline",
      "body": "We need to setup automated testing and deployment pipeline for the project",
      "labels": ["enhancement", "devops"],
      "assignees": [],
      "milestone": []
    }
  ]
}
```

## 🔧 Development

### Building the Action
```bash
# Build the action for distribution
npm run build
```
*This creates a compiled version in `dist/index.js` that includes all dependencies*

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Code Quality
```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Local Testing
1. Make your changes to `index.js`
2. Build the action: `npm run build`
3. Create a test CSV/JSON file in the repository
4. Create a workflow file in `.github/workflows/test.yml`
5. Use the action with `dry-run: true` to test without creating issues

**Note:** The `dist/` directory must be committed as it contains the compiled action that GitHub Actions will execute.

## 🚢 Deployment & Distribution

### Action Distribution
This action uses `@vercel/ncc` to compile all dependencies into a single `dist/index.js` file. This approach:
- Eliminates the need for `node_modules` in the repository
- Ensures fast action startup times
- Reduces potential dependency conflicts
- Simplifies deployment

### Version Management
- The `dist/` directory must be committed with every change
- GitHub Actions references the compiled code in `dist/index.js`
- Use semantic versioning for releases (e.g., v1.0.0, v1.1.0)
- Maintain major version tags (e.g., v1) that point to the latest stable release

## 🔒 Security & Best Practices
### Required Permissions
The GitHub token needs these permissions:
- `issues: write` - To create issues
- `metadata: read` - To read repository information

### Rate Limiting
The action includes built-in rate limiting:
- 100ms delay between issue creation
- Graceful handling of API errors
- Detailed error reporting

### Error Handling
- Validates input files before processing
- Continues processing if individual issues fail
- Provides detailed success/failure reports

## 📋 CI/CD Pipeline
The repository includes a complete CI/CD setup:

1. **Continuous Integration (`build-test.yml`):**
   - Runs on Node.js 18 and 20
   - Executes linting and tests
   - Builds the action using `npm run build`
   - Generates coverage reports
   - Tests the action with dry-run mode

2. **Security Analysis (`codeql.yml`):**
   - CodeQL analysis for JavaScript
   - Weekly security scans (Mondays at 2 AM UTC)
   - Automated vulnerability detection
   - Runs on pushes and pull requests

3. **Dependency Management (`dependabot.yml`):**
   - Dependabot for weekly updates
   - Automatic PR creation for updates
   - Proper labeling and organization

4. **Release Automation:**
   - Automatic tagging on releases
   - Built `dist/` directory for GitHub Actions
   - Major version tag updates

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes to the source code
4. Build the action: `npm run build`
5. Add tests for new functionality
6. Ensure all tests pass: `npm test`
7. Lint your code: `npm run lint:fix`
8. Commit your changes (including the updated `dist/` directory): `git commit -m 'Add amazing feature'`
9. Push to the branch: `git push origin feature/amazing-feature`
10. Open a Pull Request

**Important:** Always commit the `dist/` directory after making changes, as it contains the compiled action that GitHub Actions executes.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔐 Security
For security concerns and vulnerability reporting, please see our [Security Policy](SECURITY.md).

## 🆘 Support
If you encounter any issues:

1. Check the [existing issues](https://github.com/dsanchezcr/issue-importer-action/issues)
2. Review the [documentation](README.md)
3. Create a new issue with:
   - Clear description of the problem
   - Sample input files (remove sensitive data)
   - Workflow configuration
   - Error messages or logs
---

**Happy automating!** 🎉