# Security Policy

## Supported Versions

We actively support the following versions of the Issue Importer Action with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of the Issue Importer Action seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **Do NOT create a public GitHub issue** for security vulnerabilities
2. **Email us directly** at the repository maintainer's email

### What to Include

When reporting a vulnerability, please include:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity
- Any suggested fixes or mitigations
- Your contact information for follow-up

## Security Considerations

### Token Security

- **GitHub Token Permissions**: This action requires a GitHub token with repository write permissions. Use tokens with minimal necessary permissions
- **Token Storage**: Always store GitHub tokens as encrypted secrets, never in plain text
- **Token Scope**: Use fine-grained personal access tokens when possible, limiting scope to specific repositories

### Input Validation

- **File Validation**: All input files (CSV/JSON) are validated before processing.
- **Data Sanitization**: Issue content is sanitized to prevent injection attacks.
- **File Size Limits**: Large files are handled with memory-conscious parsing to prevent DoS.

### Best Practices for Users

#### Secure Token Management
```yaml
# ✅ Good - Using encrypted secrets
with:
  github-token: ${{ secrets.GITHUB_TOKEN }}

# ❌ Bad - Never do this
with:
  github-token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Input File Security
- Validate file sources and ensure they come from trusted locations
- Use the `dry-run` mode to test imports before executing
- Review imported data for malicious content
- Limit file access to necessary team members

#### Workflow Security
```yaml
# ✅ Recommended workflow permissions
permissions:
  issues: write
  contents: read

# Specify exact action version
uses: dsanchezcr/issue-importer-action@v1.0.0  # Pin to specific version
```

### Known Security Limitations

1. **File Content Trust**: This action trusts the content of input files. Users are responsible for validating file contents
2. **GitHub API Rate Limits**: The action respects GitHub API rate limits but does not implement additional rate limiting
3. **Large File Processing**: Very large files may consume significant memory during processing

## Secure Development Practices

### For Contributors

- All pull requests undergo security review
- Dependencies are regularly updated and scanned for vulnerabilities
- Code follows secure coding practices:
  - Input validation and sanitization
  - Proper error handling without information disclosure
  - Minimal privilege principles

### Dependency Management

- Dependencies are pinned to specific versions
- Regular dependency updates and security scanning
- Use of `npm audit` and GitHub security alerts
- Automated dependency updates via Dependabot

### Code Review Process

- All changes require review from maintainers
- Security-focused code review checklist
- Automated testing including security test cases
- Static analysis tools integration

## Security Features

### Built-in Protections

1. **Input Validation**: Comprehensive validation of CSV/JSON files
2. **Error Handling**: Secure error messages that don't leak sensitive information
3. **Memory Management**: Efficient parsing to prevent memory exhaustion
4. **API Safety**: Safe GitHub API usage with proper error handling

### Dry Run Mode

Use dry run mode to safely test imports:

```yaml
- name: Test Import (Dry Run)
  uses: dsanchezcr/issue-importer-action@v1.0.0
  with:
    file-path: 'issues.csv'
    file-format: 'csv'
    github-token: ${{ secrets.GITHUB_TOKEN }}
    dry-run: true
```

## Compliance and Standards

- Follows GitHub Actions security best practices
- Regular security assessments and updates
- Transparent security issue handling

## Acknowledgments

We appreciate the security research community and thank all researchers who responsibly disclose vulnerabilities. Contributors who report valid security issues will be acknowledged in our security advisories (with their permission).

---
**Note**: This security policy is regularly reviewed and updated. Please check back periodically for the latest information.