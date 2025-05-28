const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const Papa = require('papaparse');

/**
 * Parse CSV file and return array of issue objects
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Array of issue objects
 */
async function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`));
          return;
        }
        resolve(result.data);
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Parse JSON file and return array of issue objects
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Array>} Array of issue objects
 */
async function parseJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    // Support both array format and object with issues array
    if (Array.isArray(data)) {
      return data;
    } else if (data.issues && Array.isArray(data.issues)) {
      return data.issues;
    } else {
      throw new Error('JSON file must contain an array of issues or an object with an "issues" array');
    }
  } catch (error) {
    throw new Error(`Failed to parse JSON file: ${error.message}`);
  }
}

/**
 * Validate issue object has required fields
 * @param {Object} octokit - GitHub API client
 * @param {Object} context - GitHub context
 * @param {Object} issue - Issue object to validate
 * @param {number} index - Index for error reporting
 * @param {Map} milestoneMap - Map of milestone titles to numbers
 * @returns {Promise<Object>} Validated and normalized issue object
 */
async function validateIssue(octokit, context, issue, index, milestoneMap) {
  if (!issue.title || typeof issue.title !== 'string' || issue.title.trim() === '') {
    throw new Error(`Issue at index ${index} is missing a valid title`);
  }

  const parsedAssignees = parseAssignees(issue.assignees);
  const validAssignees = await validateAssignees(octokit, context, parsedAssignees);

  return {
    title: issue.title.trim(),
    body: issue.body || issue.description || '',
    labels: parseLabels(issue.labels),
    assignees: validAssignees,
    milestone: resolveMilestone(issue.milestone, milestoneMap)
  };
}

/**
 * Parse labels from various formats
 * @param {string|Array} labels - Labels in string or array format
 * @returns {Array} Array of label strings
 */
function parseLabels(labels) {
  if (!labels) return [];

  if (Array.isArray(labels)) {
    return labels.filter(label => label && typeof label === 'string');
  }

  if (typeof labels === 'string') {
    // Replace semicolons with commas, then split on commas
    const normalized = labels.replace(/;/g, ',');
    return normalized.split(',').map(label => label.trim()).filter(label => label);
  }

  return [];
}

/**
 * Parse assignees from various formats
 * @param {string|Array} assignees - Assignees in string or array format
 * @returns {Array} Array of assignee usernames
 */
function parseAssignees(assignees) {
  if (!assignees) return [];

  if (Array.isArray(assignees)) {
    return assignees.filter(assignee => assignee && typeof assignee === 'string');
  }

  if (typeof assignees === 'string') {
    // Replace semicolons with commas, then split on commas
    const normalized = assignees.replace(/;/g, ',');
    return normalized.split(',').map(assignee => assignee.trim()).filter(assignee => assignee);
  }

  return [];
}

/**
 * Validate assignees exist in the repository
 * @param {Object} octokit - GitHub API client
 * @param {Object} context - GitHub context
 * @param {Array} assignees - Array of assignee usernames
 * @returns {Promise<Array>} Array of valid assignee usernames
 */
async function validateAssignees(octokit, context, assignees) {
  if (!assignees || assignees.length === 0) return [];

  const { owner, repo } = context.repo;
  const validAssignees = [];

  for (const assignee of assignees) {
    try {
      // Check if user exists and has access to the repository
      await octokit.rest.repos.checkCollaborator({
        owner,
        repo,
        username: assignee
      });
      validAssignees.push(assignee);
      core.debug(`✅ Assignee '${assignee}' is valid`);
    } catch (error) {
      if (error.status === 404) {
        core.warning(`⚠️ Assignee '${assignee}' is not a collaborator of this repository. Skipping.`);
      } else {
        core.warning(`⚠️ Could not validate assignee '${assignee}': ${error.message}. Skipping.`);
      }
    }
  }

  return validAssignees;
}

/**
 * Get all milestones for the repository and create a mapping
 * @param {Object} octokit - GitHub API client
 * @param {Object} context - GitHub context
 * @returns {Promise<Map>} Map of milestone titles to milestone numbers
 */
async function getMilestoneMapping(octokit, context) {
  try {
    const { owner, repo } = context.repo;
    const response = await octokit.rest.issues.listMilestones({
      owner,
      repo,      state: 'all' // Include both open and closed milestones
    });

    const milestoneMap = new Map();
    response.data.forEach(milestone => {
      milestoneMap.set(milestone.title, milestone.number);    });

    core.info(`📋 Found ${milestoneMap.size} milestones in repository`);
    return milestoneMap;
  } catch (error) {
    core.warning(`Failed to fetch milestones: ${error.message}`);
    return new Map();
  }
}

/**
 * Resolve milestone to number
 * @param {string|number} milestone - Milestone title or number
 * @param {Map} milestoneMap - Map of milestone titles to numbers
 * @returns {number|null} Milestone number or null
 */
function resolveMilestone(milestone, milestoneMap) {  if (!milestone) return null;

  // If it's already a number, return it
  if (typeof milestone === 'number') {
    return milestone;  }

  // If it's a string that can be parsed as a number, parse it
  const parsed = parseInt(milestone, 10);
  if (!isNaN(parsed) && parsed.toString() === milestone.toString()) {
    return parsed;  }

  // Try to find by milestone title
  if (milestoneMap.has(milestone)) {
    return milestoneMap.get(milestone);  }

  // If milestone not found, log warning and return null
  core.warning(`Milestone "${milestone}" not found in repository. Issue will be created without milestone.`);
  return null;
}

/**
 * Create a GitHub issue
 * @param {Object} octokit - GitHub API client
 * @param {Object} context - GitHub context
 * @param {Object} issue - Issue object
 * @param {boolean} dryRun - Whether this is a dry run
 * @returns {Promise<Object>} Created issue or dry run result
 */
async function createIssue(octokit, context, issue, dryRun) {
  const { owner, repo } = context.repo;

  if (dryRun) {
    core.info(`[DRY RUN] Would create issue: "${issue.title}"`);
    core.info(`  Labels: ${issue.labels.join(', ') || 'None'}`);
    core.info(`  Assignees: ${issue.assignees.join(', ') || 'None'}`);
    core.info(`  Milestone: ${issue.milestone || 'None'}`);
    return {
      status: 'dry-run',
      title: issue.title,
      number: 'DRY-RUN'
    };
  }

  try {
    // Create the issue payload
    const payload = {
      owner,
      repo,
      title: issue.title,
      body: issue.body
    };

    // Only add labels if they exist
    if (issue.labels && issue.labels.length > 0) {
      payload.labels = issue.labels;
    }

    // Only add assignees if they exist
    if (issue.assignees && issue.assignees.length > 0) {
      payload.assignees = issue.assignees;
    }

    // Only add milestone if it exists
    if (issue.milestone) {
      payload.milestone = issue.milestone;
    }

    const response = await octokit.rest.issues.create(payload);

    core.info(`✅ Created issue #${response.data.number}: "${issue.title}"`);
    return {
      status: 'created',
      title: issue.title,
      number: response.data.number,
      url: response.data.html_url
    };
  } catch (error) {
    let errorMessage = error.message;

    // Parse GitHub API validation errors for better user experience
    if (error.status === 422 && error.response?.data?.errors) {
      const validationErrors = error.response.data.errors.map(err =>
        `${err.field}: ${err.code} - ${err.message || 'Validation failed'}`
      ).join('; ');
      errorMessage = `Validation Failed: ${validationErrors}`;
    }

    core.error(`❌ Failed to create issue "${issue.title}": ${errorMessage}`);
    if (error.documentation_url) {
      core.error(`📚 See: ${error.documentation_url}`);
    }

    return {
      status: 'failed',
      title: issue.title,
      error: errorMessage
    };
  }
}

/**
 * Main action function
 */
async function run() {
  try {
    // Get inputs
    const filePath = core.getInput('file-path', { required: true });
    const fileFormat = core.getInput('file-format', { required: true }).toLowerCase();
    const githubToken = core.getInput('github-token', { required: true });
    const dryRun = core.getInput('dry-run') === 'true';

    // Validate inputs
    if (!['csv', 'json'].includes(fileFormat)) {
      throw new Error('file-format must be either "csv" or "json"');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Initialize GitHub client
    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    core.info(`🚀 Starting issue import from ${fileFormat.toUpperCase()} file: ${filePath}`);
    if (dryRun) {
      core.info('🔍 Running in DRY RUN mode - no issues will be created');
    }

    // Parse file based on format
    let issues;
    if (fileFormat === 'csv') {
      issues = await parseCsvFile(filePath);
    } else {
      issues = await parseJsonFile(filePath);
    }

    if (!Array.isArray(issues) || issues.length === 0) {
      throw new Error('No issues found in the input file');
    }

    core.info(`📊 Found ${issues.length} issues to import`);

    // Get milestone mapping
    const milestoneMap = await getMilestoneMapping(octokit, context);

    // Validate and process issues
    const results = [];
    let successCount = 0;
    let failureCount = 0;    for (let i = 0; i < issues.length; i++) {
      try {
        const validatedIssue = await validateIssue(octokit, context, issues[i], i, milestoneMap);
        const result = await createIssue(octokit, context, validatedIssue, dryRun);
        results.push(result);

        if (result.status === 'created' || result.status === 'dry-run') {
          successCount++;
        } else {
          failureCount++;
        }

        // Add a small delay to avoid rate limiting
        if (!dryRun && i < issues.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        core.error(`❌ Failed to process issue at index ${i}: ${error.message}`);
        results.push({
          status: 'failed',
          title: issues[i]?.title || 'Unknown',
          error: error.message
        });
        failureCount++;
      }
    }

    // Generate summary
    const summary = `Import completed: ${successCount} successful, ${failureCount} failed`;
    core.info(`📈 ${summary}`);

    // Set outputs
    core.setOutput('issues-created', successCount.toString());
    core.setOutput('issues-failed', failureCount.toString());
    core.setOutput('summary', summary);

    // Log detailed results
    if (results.length > 0) {
      core.startGroup('📋 Import Results');
      results.forEach((result, _index) => {
        const status = result.status === 'created' ? '✅' :
          result.status === 'dry-run' ? '🔍' : '❌';
        const info = result.number ? `#${result.number}` : '';
        core.info(`${status} ${result.title} ${info}`);
        if (result.error) {
          core.info(`   Error: ${result.error}`);
        }
      });
      core.endGroup();
    }

    if (failureCount > 0 && !dryRun) {
      core.setFailed(`${failureCount} issues failed to import`);
    }

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

// Export for testing
module.exports = {
  run,
  parseCsvFile,
  parseJsonFile,
  validateIssue,
  parseLabels,
  parseAssignees,
  validateAssignees,
  createIssue
};

// Run the action if this file is executed directly
if (require.main === module) {
  run();
}
