import { NextRequest, NextResponse } from 'next/server';

export interface GitOpsConfig {
  provider: 'github' | 'gitlab' | 'gitea' | 'custom';
  repoUrl: string;
  branch: string;
  patToken?: string;
  syncMode: 'direct_commit' | 'pr_review';
  autoSyncOnMutation: boolean;
  syncFormats: Array<'terraform' | 'json_snapshot'>;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'failed';
  lastCommitHash?: string;
}

export interface GitOpsCommitLog {
  id: string;
  hash: string;
  branch: string;
  message: string;
  author: string;
  timestamp: string;
  type: 'direct_commit' | 'pull_request';
  prNumber?: number;
  prUrl?: string;
  status: 'merged' | 'open' | 'applied';
  filesChanged: string[];
}

// In-memory / Mock storage for GitOps
let gitOpsStore: Record<string, { config: GitOpsConfig; logs: GitOpsCommitLog[] }> = {};

function getInitialConfig(zoneName = 'example.com'): GitOpsConfig {
  return {
    provider: 'github',
    repoUrl: `https://github.com/enterprise-corp/cloudflare-infra-${zoneName.replace(/\./g, '-')}`,
    branch: 'main',
    syncMode: 'pr_review',
    autoSyncOnMutation: true,
    syncFormats: ['terraform', 'json_snapshot'],
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    lastSyncStatus: 'success',
    lastCommitHash: '8f1e4a2',
  };
}

function getInitialLogs(zoneName = 'example.com'): GitOpsCommitLog[] {
  return [
    {
      id: 'git-01',
      hash: '8f1e4a2',
      branch: 'main',
      message: `chore(cf-sync): automated Terraform state export for ${zoneName}`,
      author: 'DevSecOps Bot',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      type: 'direct_commit',
      status: 'applied',
      filesChanged: ['terraform/main.tf', 'terraform/terraform.tfvars', 'snapshots/latest.json'],
    },
    {
      id: 'git-02',
      hash: '3c7d9e1',
      branch: 'pr/waf-rate-limiting-update',
      message: `feat(waf): enhance rate limiting policies for /api/v1/auth`,
      author: 'Security Lead (devsecops-lead)',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      type: 'pull_request',
      prNumber: 42,
      prUrl: `https://github.com/enterprise-corp/cloudflare-infra-${zoneName.replace(/\./g, '-')}/pull/42`,
      status: 'merged',
      filesChanged: ['terraform/main.tf'],
    },
    {
      id: 'git-03',
      hash: 'a1b2c3d',
      branch: 'main',
      message: `init(repo): baseline infrastructure as code configuration (SSL Strict & WAF)`,
      author: 'Cloud Admin',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      type: 'direct_commit',
      status: 'applied',
      filesChanged: ['terraform/main.tf', 'terraform/terraform.tfvars', 'README.md'],
    },
  ];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get('zoneId') || 'default';
  const zoneName = searchParams.get('zoneName') || 'security-enterprise.io';

  if (!gitOpsStore[zoneId]) {
    gitOpsStore[zoneId] = {
      config: getInitialConfig(zoneName),
      logs: getInitialLogs(zoneName),
    };
  }

  return NextResponse.json({
    config: gitOpsStore[zoneId].config,
    logs: gitOpsStore[zoneId].logs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, zoneId = 'default', zoneName = 'security-enterprise.io', config, commitMessage, prTitle, prBody } = body;

    if (!gitOpsStore[zoneId]) {
      gitOpsStore[zoneId] = {
        config: getInitialConfig(zoneName),
        logs: getInitialLogs(zoneName),
      };
    }

    // 1. Save / Update Config
    if (action === 'save_config') {
      gitOpsStore[zoneId].config = {
        ...gitOpsStore[zoneId].config,
        ...config,
      };
      return NextResponse.json({
        success: true,
        message: 'GitOps configuration saved successfully!',
        config: gitOpsStore[zoneId].config,
      });
    }

    // 2. Direct Commit & Push
    if (action === 'push_commit') {
      const newHash = Math.random().toString(16).substring(2, 9);
      const newLog: GitOpsCommitLog = {
        id: `git-${Date.now()}`,
        hash: newHash,
        branch: gitOpsStore[zoneId].config.branch || 'main',
        message: commitMessage || `chore(cf-sync): sync live state to ${gitOpsStore[zoneId].config.branch}`,
        author: 'DevSecOps Operator',
        timestamp: new Date().toISOString(),
        type: 'direct_commit',
        status: 'applied',
        filesChanged: ['terraform/main.tf', 'terraform/terraform.tfvars', 'snapshots/latest.json'],
      };

      gitOpsStore[zoneId].logs.unshift(newLog);
      gitOpsStore[zoneId].config.lastSyncTime = newLog.timestamp;
      gitOpsStore[zoneId].config.lastSyncStatus = 'success';
      gitOpsStore[zoneId].config.lastCommitHash = newHash;

      return NextResponse.json({
        success: true,
        message: `Successfully pushed commit [${newHash}] to ${gitOpsStore[zoneId].config.branch}!`,
        log: newLog,
      });
    }

    // 3. Create Pull Request for Review
    if (action === 'create_pr') {
      const newHash = Math.random().toString(16).substring(2, 9);
      const prNumber = Math.floor(Math.random() * 90) + 50;
      const branchName = `pr/cf-sync-${Date.now().toString().slice(-4)}`;

      const newLog: GitOpsCommitLog = {
        id: `git-${Date.now()}`,
        hash: newHash,
        branch: branchName,
        message: prTitle || `feat(cf-change): configuration update proposal for ${zoneName}`,
        author: 'DevSecOps Operator',
        timestamp: new Date().toISOString(),
        type: 'pull_request',
        prNumber,
        prUrl: `${gitOpsStore[zoneId].config.repoUrl}/pull/${prNumber}`,
        status: 'open',
        filesChanged: ['terraform/main.tf', 'terraform/terraform.tfvars'],
      };

      gitOpsStore[zoneId].logs.unshift(newLog);

      return NextResponse.json({
        success: true,
        message: `Created Pull Request #${prNumber} on ${gitOpsStore[zoneId].config.repoUrl}!`,
        log: newLog,
      });
    }

    // 4. Sync from Git to Cloudflare (Simulated Apply)
    if (action === 'sync_from_git') {
      gitOpsStore[zoneId].config.lastSyncTime = new Date().toISOString();
      gitOpsStore[zoneId].config.lastSyncStatus = 'success';

      return NextResponse.json({
        success: true,
        message: `Successfully pulled configuration from Git (${gitOpsStore[zoneId].config.branch}) and applied to Cloudflare!`,
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
