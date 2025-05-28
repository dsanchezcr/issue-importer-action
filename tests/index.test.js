const {
  parseCsvFile,
  parseJsonFile,
  validateIssue,
  parseLabels,
  parseAssignees,
  validateAssignees,
  createIssue
} = require('../index');
const fs = require('fs');
const path = require('path');

// Mock @actions/core
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  debug: jest.fn(),
  startGroup: jest.fn(),
  endGroup: jest.fn()
}));

// Mock @actions/github
jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(),
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo'
    }
  }
}));

describe('Issue Importer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCsvFile', () => {
    it('should parse a valid CSV file', async () => {
      const csvContent = 'title,body,labels\n"Test Issue","Test body","bug,enhancement"';
      const testFile = path.join(__dirname, 'test.csv');

      fs.writeFileSync(testFile, csvContent);

      try {
        const result = await parseCsvFile(testFile);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          title: 'Test Issue',
          body: 'Test body',
          labels: 'bug,enhancement'
        });
      } finally {
        fs.unlinkSync(testFile);
      }
    });

    it('should handle empty CSV file', async () => {
      const csvContent = 'title,body,labels\n';
      const testFile = path.join(__dirname, 'empty.csv');

      fs.writeFileSync(testFile, csvContent);

      try {
        const result = await parseCsvFile(testFile);
        expect(result).toHaveLength(0);
      } finally {
        fs.unlinkSync(testFile);
      }
    });
  });

  describe('parseJsonFile', () => {
    it('should parse a valid JSON array', async () => {
      const jsonContent = JSON.stringify([
        { title: 'Test Issue', body: 'Test body', labels: ['bug'] }
      ]);
      const testFile = path.join(__dirname, 'test.json');

      fs.writeFileSync(testFile, jsonContent);

      try {
        const result = await parseJsonFile(testFile);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          title: 'Test Issue',
          body: 'Test body',
          labels: ['bug']
        });
      } finally {
        fs.unlinkSync(testFile);
      }
    });

    it('should parse a valid JSON object with issues array', async () => {
      const jsonContent = JSON.stringify({
        issues: [
          { title: 'Test Issue', body: 'Test body', labels: ['bug'] }
        ]
      });
      const testFile = path.join(__dirname, 'test-object.json');

      fs.writeFileSync(testFile, jsonContent);

      try {
        const result = await parseJsonFile(testFile);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          title: 'Test Issue',
          body: 'Test body',
          labels: ['bug']
        });
      } finally {
        fs.unlinkSync(testFile);
      }
    });

    it('should throw error for invalid JSON', async () => {
      const jsonContent = '{ invalid json }';
      const testFile = path.join(__dirname, 'invalid.json');

      fs.writeFileSync(testFile, jsonContent);

      try {
        await expect(parseJsonFile(testFile)).rejects.toThrow('Failed to parse JSON file');
      } finally {
        fs.unlinkSync(testFile);
      }
    });
  });
  describe('validateIssue', () => {
    let mockOctokit, mockContext, mockMilestoneMap;

    beforeEach(() => {
      mockOctokit = {
        rest: {
          repos: {
            checkCollaborator: jest.fn()
          }
        }
      };

      mockContext = {
        repo: {
          owner: 'test-owner',
          repo: 'test-repo'
        }
      };

      mockMilestoneMap = new Map();
    });

    it('should validate a valid issue with valid assignees', async () => {
      const issue = {
        title: 'Test Issue',
        body: 'Test body',
        labels: ['bug', 'enhancement'],
        assignees: ['user1']
      };

      // Mock successful collaborator check
      mockOctokit.rest.repos.checkCollaborator.mockResolvedValue({ status: 204 });

      const result = await validateIssue(mockOctokit, mockContext, issue, 0, mockMilestoneMap);
      expect(result).toEqual({
        title: 'Test Issue',
        body: 'Test body',
        labels: ['bug', 'enhancement'],
        assignees: ['user1'],
        milestone: null
      });
    });

    it('should filter out invalid assignees', async () => {
      const issue = {
        title: 'Test Issue',
        body: 'Test body',
        labels: ['bug'],
        assignees: ['valid-user', 'invalid-user']
      };

      // Mock collaborator check - first succeeds, second fails
      mockOctokit.rest.repos.checkCollaborator
        .mockResolvedValueOnce({ status: 204 })
        .mockRejectedValueOnce({ status: 404 });

      const result = await validateIssue(mockOctokit, mockContext, issue, 0, mockMilestoneMap);
      expect(result.assignees).toEqual(['valid-user']);
    });

    it('should throw error for missing title', async () => {
      const issue = { body: 'Test body' };
      await expect(validateIssue(mockOctokit, mockContext, issue, 0, mockMilestoneMap))
        .rejects.toThrow('Issue at index 0 is missing a valid title');
    });

    it('should handle missing optional fields', async () => {
      const issue = { title: 'Test Issue' };
      const result = await validateIssue(mockOctokit, mockContext, issue, 0, mockMilestoneMap);

      expect(result).toEqual({
        title: 'Test Issue',
        body: '',
        labels: [],
        assignees: [],
        milestone: null
      });
    });

    it('should use description as body if body is missing', async () => {
      const issue = { title: 'Test Issue', description: 'Test description' };
      const result = await validateIssue(mockOctokit, mockContext, issue, 0, mockMilestoneMap);

      expect(result.body).toBe('Test description');
    });
  });
  describe('parseLabels', () => {
    it('should parse array of labels', () => {
      const labels = ['bug', 'enhancement'];
      const result = parseLabels(labels);
      expect(result).toEqual(['bug', 'enhancement']);
    });

    it('should parse comma-separated string', () => {
      const labels = 'bug,enhancement,feature';
      const result = parseLabels(labels);
      expect(result).toEqual(['bug', 'enhancement', 'feature']);
    });

    it('should parse semicolon-separated string', () => {
      const labels = 'bug;enhancement;feature';
      const result = parseLabels(labels);
      expect(result).toEqual(['bug', 'enhancement', 'feature']);
    });

    it('should handle single label without separators', () => {
      const labels = 'single-label';
      const result = parseLabels(labels);
      expect(result).toEqual(['single-label']);
    });

    it('should trim whitespace from labels', () => {
      const labels = ' bug , enhancement ; feature ';
      const result = parseLabels(labels);
      expect(result).toEqual(['bug', 'enhancement', 'feature']);
    });

    it('should handle empty or null labels', () => {
      expect(parseLabels(null)).toEqual([]);
      expect(parseLabels('')).toEqual([]);
      expect(parseLabels([])).toEqual([]);
    });

    it('should filter out empty strings', () => {
      const labels = ['bug', '', 'enhancement'];
      const result = parseLabels(labels);
      expect(result).toEqual(['bug', 'enhancement']);
    });
  });
  describe('parseAssignees', () => {
    it('should parse array of assignees', () => {
      const assignees = ['user1', 'user2'];
      const result = parseAssignees(assignees);
      expect(result).toEqual(['user1', 'user2']);
    });

    it('should parse comma-separated string', () => {
      const assignees = 'user1,user2,user3';
      const result = parseAssignees(assignees);
      expect(result).toEqual(['user1', 'user2', 'user3']);
    });

    it('should parse semicolon-separated string', () => {
      const assignees = 'user1;user2;user3';
      const result = parseAssignees(assignees);
      expect(result).toEqual(['user1', 'user2', 'user3']);
    });

    it('should handle single assignee without separators', () => {
      const assignees = 'single-user';
      const result = parseAssignees(assignees);
      expect(result).toEqual(['single-user']);
    });

    it('should trim whitespace from assignees', () => {
      const assignees = ' user1 , user2 ; user3 ';
      const result = parseAssignees(assignees);
      expect(result).toEqual(['user1', 'user2', 'user3']);
    });    it('should handle empty or null assignees', () => {
      expect(parseAssignees(null)).toEqual([]);
      expect(parseAssignees('')).toEqual([]);
      expect(parseAssignees([])).toEqual([]);
    });
  });

  describe('validateAssignees', () => {
    let mockOctokit, mockContext;

    beforeEach(() => {
      mockOctokit = {
        rest: {
          repos: {
            checkCollaborator: jest.fn()
          }
        }
      };

      mockContext = {
        repo: {
          owner: 'test-owner',
          repo: 'test-repo'
        }
      };
    });

    it('should return valid collaborators', async () => {
      const assignees = ['user1', 'user2'];
      mockOctokit.rest.repos.checkCollaborator.mockResolvedValue({ status: 204 });

      const result = await validateAssignees(mockOctokit, mockContext, assignees);
      expect(result).toEqual(['user1', 'user2']);
      expect(mockOctokit.rest.repos.checkCollaborator).toHaveBeenCalledTimes(2);
    });

    it('should filter out non-collaborators', async () => {
      const assignees = ['valid-user', 'invalid-user'];
      mockOctokit.rest.repos.checkCollaborator
        .mockResolvedValueOnce({ status: 204 })
        .mockRejectedValueOnce({ status: 404 });

      const result = await validateAssignees(mockOctokit, mockContext, assignees);
      expect(result).toEqual(['valid-user']);
    });

    it('should handle empty assignees array', async () => {
      const result = await validateAssignees(mockOctokit, mockContext, []);
      expect(result).toEqual([]);
      expect(mockOctokit.rest.repos.checkCollaborator).not.toHaveBeenCalled();
    });

    it('should handle null assignees', async () => {
      const result = await validateAssignees(mockOctokit, mockContext, null);
      expect(result).toEqual([]);
      expect(mockOctokit.rest.repos.checkCollaborator).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const assignees = ['user1'];
      mockOctokit.rest.repos.checkCollaborator.mockRejectedValue(new Error('API Error'));

      const result = await validateAssignees(mockOctokit, mockContext, assignees);
      expect(result).toEqual([]);
    });
  });

  describe('createIssue', () => {
    const mockOctokit = {
      rest: {
        issues: {
          create: jest.fn()
        }
      }
    };

    const mockContext = {
      repo: {
        owner: 'test-owner',
        repo: 'test-repo'
      }
    };

    const testIssue = {
      title: 'Test Issue',
      body: 'Test body',
      labels: ['bug'],
      assignees: ['user1'],
      milestone: null
    };

    beforeEach(() => {
      mockOctokit.rest.issues.create.mockClear();
    });

    it('should create issue successfully', async () => {
      const mockResponse = {
        data: {
          number: 123,
          html_url: 'https://github.com/test-owner/test-repo/issues/123'
        }
      };
      mockOctokit.rest.issues.create.mockResolvedValue(mockResponse);

      const result = await createIssue(mockOctokit, mockContext, testIssue, false);

      expect(result).toEqual({
        status: 'created',
        title: 'Test Issue',
        number: 123,
        url: 'https://github.com/test-owner/test-repo/issues/123'
      });      expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'Test Issue',
        body: 'Test body',
        labels: ['bug'],
        assignees: ['user1']
      });
    });

    it('should handle dry run mode', async () => {
      const result = await createIssue(mockOctokit, mockContext, testIssue, true);

      expect(result).toEqual({
        status: 'dry-run',
        title: 'Test Issue',
        number: 'DRY-RUN'
      });

      expect(mockOctokit.rest.issues.create).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockOctokit.rest.issues.create.mockRejectedValue(error);

      const result = await createIssue(mockOctokit, mockContext, testIssue, false);

      expect(result).toEqual({
        status: 'failed',
        title: 'Test Issue',
        error: 'API Error'
      });
    });
  });
});
