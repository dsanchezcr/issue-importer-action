[![Build and Test](https://github.com/dsanchezcr/issue-importer-action/actions/workflows/build-test.yml/badge.svg)](https://github.com/dsanchezcr/issue-importer-action/actions/workflows/build-test.yml)
[![CodeQL](https://github.com/dsanchezcr/issue-importer-action/actions/workflows/codeql.yml/badge.svg)](https://github.com/dsanchezcr/issue-importer-action/actions/workflows/codeql.yml)

# Issue Importer Action

A GitHub Action that imports issues from CSV or JSON files into your repository. Perfect for migrating issues from other systems, bulk creating issues from spreadsheets, or automating issue creation from structured data.

![Issue Importer Action Logo](logo.png)

## Features

- 📊 **Multiple Formats**: Supports both CSV and JSON input files
- 🔍 **Dry Run Mode**: Test your import without creating actual issues
- 🏷️ **Rich Metadata**: Support for labels, assignees, and milestones
- ✅ **Validation**: Validates issue data before import
- 📈 **Detailed Reporting**: Provides comprehensive import summaries
- 🛡️ **Error Handling**: Graceful handling of malformed data

## Usage

### Basic Example

```yaml
name: Import Issues
on:
  workflow_dispatch:
    inputs:
      file_path:
        description: 'Path to the issue file'
        required: true
        default: 'issues.csv'

jobs:
  import-issues:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Import Issues
        uses: dsanchezcr/issue-importer-action@v1.0.0
        with:
          file-path: ${{ github.event.inputs.file_path }}
          file-format: csv
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Example with Dry Run

```yaml
name: Import Issues (Advanced)
on:
  pull_request:
    paths:
      - 'data/issues.json'

jobs:
  dry-run-import:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Dry Run Issue Import
        uses: dsanchezcr/issue-importer-action@v1.0.0
        with:
          file-path: 'data/issues.json'
          file-format: json
          github-token: ${{ secrets.GITHUB_TOKEN }}
          dry-run: true

  import-issues:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Import Issues
        uses: dsanchezcr/issue-importer-action@v1
        with:
          file-path: 'data/issues.json'
          file-format: json
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Input Formats

### CSV Format

Your CSV file should have the following columns (title is required, others are optional):

```csv
title,body,labels,assignees,milestone
"Bug: App crashes on startup","The application crashes when...",bug;critical,username1;username2,v1.0
"Feature: Add dark mode","Users have requested...",enhancement,username1,v2.0
```

**CSV Column Details:**
- `title` (required): Issue title
- `body` or `description`: Issue description/body
- `labels`: Comma or semicolon-separated list of labels
- `assignees`: Comma or semicolon-separated list of GitHub usernames
- `milestone`: Milestone name

### JSON Format

#### Array Format
```json
[
  {
    "title": "Bug: App crashes on startup",
    "body": "The application crashes when users try to start it...",
    "labels": ["bug", "critical"],
    "assignees": ["username1", "username2"],
    "milestone": "v1.0"
  },
  {
    "title": "Feature: Add dark mode",
    "description": "Users have requested a dark mode option...",
    "labels": "enhancement",
    "assignees": "username1",
    "milestone": "v2.0"
  }
]
```

#### Object Format
```json
{
  "issues": [
    {
      "title": "Bug: App crashes on startup",
      "body": "The application crashes when users try to start it...",
      "labels": ["bug", "critical"],
      "assignees": ["username1"]
    }
  ]
}
```

**JSON Field Details:**
- `title` (required): Issue title
- `body` or `description`: Issue description
- `labels`: Array of strings or comma-separated string
- `assignees`: Array of GitHub usernames or comma-separated string
- `milestone`: Milestone name

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `file-path` | Path to the CSV or JSON file containing issues | Yes | - |
| `file-format` | Format of the input file (`csv` or `json`) | Yes | `csv` |
| `github-token` | GitHub token with repository write permissions | Yes | - |
| `dry-run` | Perform a dry run without creating actual issues | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `issues-created` | Number of issues successfully created |
| `issues-failed` | Number of issues that failed to create |
| `summary` | Summary of the import operation |

## Permissions

The GitHub token used must have the following permissions:
- `issues: write` - To create issues
- `metadata: read` - To read repository metadata

For organization repositories, ensure the token has appropriate access to the target repository.

## Error Handling

The action includes comprehensive error handling:

- **File Validation**: Checks if the input file exists and is readable
- **Format Validation**: Validates CSV/JSON structure and content
- **Data Validation**: Ensures required fields (title) are present
- **API Error Handling**: Gracefully handles GitHub API errors
- **Partial Failures**: Continues processing remaining issues if some fail

## Troubleshooting

### Common Issues and Solutions

#### 1. Milestone Not Found Error
```
Warning: Milestone "v1.0" not found in repository. Issue will be created without milestone.
```

**Solution**: Create the milestone in your repository first, or remove/update the milestone reference in your data file.

#### 2. Invalid Assignees Error
```
Error: Validation Failed: {"value":"alice;bob","resource":"Issue","field":"assignees","code":"invalid"}
```

**Causes and Solutions**:
- **Invalid usernames**: Replace placeholder usernames like "alice", "bob" with actual GitHub usernames of repository collaborators
- **Non-collaborators**: Ensure all assignees are collaborators on the repository
- **Separator issues**: The action now supports both comma (`,`) and semicolon (`;`) separators for CSV files

**Example fix**:
```csv
# Before (incorrect)
"Setup CI/CD Pipeline","Description","enhancement","alice;bob","v1.0"

# After (correct)
"Setup CI/CD Pipeline","Description","enhancement","","v1.0"
```

#### 3. Permission Errors
```
Error: Resource not accessible by integration
```

**Solution**: Ensure your GitHub token has the required permissions:
- `issues: write`
- `metadata: read`

#### 4. CSV Parsing Issues

If you're having trouble with CSV files:
- Ensure proper quoting of fields containing commas or newlines
- Use either commas or semicolons consistently for separating multiple values
- Check for encoding issues (use UTF-8)

#### 5. Rate Limiting

If you're importing many issues:
- The action includes automatic delays between requests
- Consider running with `dry-run: true` first to validate your data
- For very large imports, consider splitting into smaller batches

### Validation Tips

1. **Always test with dry-run first**:
   ```yaml
   with:
     dry-run: true
   ```

2. **Validate assignee usernames**: Ensure all usernames exist and are collaborators

3. **Check milestone names**: Verify milestones exist in your repository

4. **Use corrected examples**: Check the `examples/sample-issues.csv` and `examples/sample-issues.json` files for proper formatting

## Examples

### Example CSV File

```csv
title,body,labels,assignees
"Setup CI/CD Pipeline","We need to setup automated testing and deployment","enhancement;devops",""
"Fix login bug","Users can't login with special characters in password","bug;high-priority",""
"Update documentation","API documentation needs updating","documentation",""
```

### Example JSON File

```json
{
  "issues": [    {
      "title": "Setup CI/CD Pipeline",
      "body": "We need to setup automated testing and deployment",
      "labels": ["enhancement", "devops"],
      "assignees": []
    },
    {
      "title": "Fix login bug",
      "body": "Users can't login with special characters in password",
      "labels": ["bug", "high-priority"],
      "assignees": []
    }
  ]
}
```

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Build the action
npm run build
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
# Check for linting issues
npm run lint

# Fix linting issues
npm run lint:fix
```

### Building for Distribution

The action uses `@vercel/ncc` to compile all dependencies into a single file:

```bash
npm run build
```

This creates `dist/index.js` which must be committed to the repository for GitHub Actions to execute.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Lint your code: `npm run lint:fix`
7. Build the action: `npm run build`
8. Commit your changes (including the `dist/` directory): `git commit -m 'Add your feature'`
9. Push to the branch: `git push origin feature/your-feature`
10. Submit a pull request

**Important**: Always include the updated `dist/` directory in your commits as it contains the compiled action code.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

For security concerns and vulnerability reporting, please see our [Security Policy](SECURITY.md).

## Support

If you encounter any issues or have questions:

1. Check the [existing issues](https://github.com/dsanchezcr/issue-importer-action/issues)
2. Create a new issue with detailed information about your problem
3. Include sample data and workflow configuration when reporting bugs