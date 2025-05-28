---
name: Bug Report
about: Create a report to help us improve the Issue Importer Action
title: '[BUG] '
labels: ['bug', 'triage']
assignees: 'dsanchezcr'
---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Environment
- Action Version: [e.g., v1.0.0]
- Runner OS: [e.g., ubuntu-latest, windows-latest]
- Node.js Version: [e.g., 18, 20]
- File Format: [e.g., CSV, JSON]

## Input File Sample
If applicable, provide a sample of your input file (remove sensitive data):

```csv
title,body,labels
"Sample Issue","This is a sample issue","bug"
```

## Workflow Configuration
```yaml
- name: Import Issues
  uses: username/issue-importer-action@v1
  with:
    file-path: 'issues.csv'
    file-format: csv
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Error Messages
If applicable, add the complete error message or log output:

```
Error message here...
```

## Screenshots
If applicable, add screenshots to help explain your problem.

## Additional Context
Add any other context about the problem here.
