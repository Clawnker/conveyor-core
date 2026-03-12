export function createGithubAdapter(config = {}) {
  return {
    name: 'github',
    config,
    async createIssue() {
      throw new Error('Not implemented: createIssue');
    },
    async createPullRequest() {
      throw new Error('Not implemented: createPullRequest');
    },
  };
}
