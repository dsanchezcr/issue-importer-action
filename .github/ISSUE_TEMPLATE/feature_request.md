---
name: Feature Request
about: Suggest an idea for the Issue Importer Action
title: '[FEATURE] '
labels: ['enhancement', 'triage']
assignees: 'dsanchezcr'
---

## Feature Description
A clear and concise description of what you want to happen.

## Problem Statement
Is your feature request related to a problem? Please describe.
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## Proposed Solution
Describe the solution you'd like.
A clear and concise description of what you want to happen.

## Alternative Solutions
Describe alternatives you've considered.
A clear and concise description of any alternative solutions or features you've considered.

## Use Case
Describe your specific use case and how this feature would help.

## Example Usage
If applicable, provide an example of how you would use this feature:

```yaml
- name: Import Issues
  uses: username/issue-importer-action@v1
  with:
    file-path: 'issues.csv'
    file-format: csv
    github-token: ${{ secrets.GITHUB_TOKEN }}
    # Your proposed new feature here
    new-feature: 'example-value'
```

## Additional Context
Add any other context, screenshots, or examples about the feature request here.