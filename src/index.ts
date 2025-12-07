import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import { getOctokit } from '@actions/github';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const OWNER = 'delivery-station';
const REPO = 'ds';

type Octokit = ReturnType<typeof getOctokit>;

interface PlatformInfo {
  fileName: string;
  binaryName: string;
  ext: string;
}

interface DownloadResult {
  path: string;
  version: string;
}

/**
 * Get platform-specific download info
 */
function getPlatformInfo(): PlatformInfo {
  const platform = os.platform();
  const arch = os.arch();
  
  let osPart: string;
  let archPart: string;
  let ext: string;
  
  // Map OS
  switch (platform) {
    case 'linux':
      osPart = 'linux';
      ext = 'tar.gz';
      break;
    case 'darwin':
      osPart = 'darwin';
      ext = 'tar.gz';
      break;
    case 'win32':
      osPart = 'windows';
      ext = 'zip';
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  
  // Map architecture
  switch (arch) {
    case 'x64':
      archPart = 'amd64';
      break;
    case 'arm64':
      archPart = 'arm64';
      break;
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }
  
  const fileName = `ds-${osPart}-${archPart}.${ext}`;
  const binaryName = platform === 'win32' ? 'ds.exe' : 'ds';
  
  return { fileName, binaryName, ext };
}

/**
 * Get the latest release version
 */
async function getLatestVersion(octokit: Octokit): Promise<string> {
  core.info('Fetching latest release...');
  const { data: release } = await octokit.rest.repos.getLatestRelease({
    owner: OWNER,
    repo: REPO,
  });
  return release.tag_name;
}

/**
 * Download and extract DS binary
 */
async function downloadDS(version: string, token: string): Promise<DownloadResult> {
  const { fileName, binaryName, ext } = getPlatformInfo();
  
  // Get version
  const octokit = getOctokit(token);
  const actualVersion = version === 'latest' ? await getLatestVersion(octokit) : version;
  
  core.info(`Installing DS ${actualVersion} for ${os.platform()}-${os.arch()}`);
  
  // Check cache
  let cachedPath = tc.find('ds', actualVersion);
  if (cachedPath) {
    core.info(`Found DS ${actualVersion} in cache`);
    core.setOutput('cache-hit', 'true');
    return { path: cachedPath, version: actualVersion };
  }
  
  core.setOutput('cache-hit', 'false');
  
  // Download
  const downloadUrl = `https://github.com/${OWNER}/${REPO}/releases/download/${actualVersion}/${fileName}`;
  core.info(`Downloading from ${downloadUrl}`);
  
  let downloadPath: string;
  try {
    downloadPath = await tc.downloadTool(downloadUrl, undefined, token);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to download DS: ${errorMessage}`);
  }
  
  // Extract
  core.info('Extracting archive...');
  let extractedPath;
  if (ext === 'tar.gz') {
    extractedPath = await tc.extractTar(downloadPath);
  } else {
    extractedPath = await tc.extractZip(downloadPath);
  }
  
  // Find binary in extracted files
  const binaryPath = path.join(extractedPath, binaryName);
  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Binary not found at ${binaryPath}`);
  }
  
  // Make executable on Unix
  if (os.platform() !== 'win32') {
    await exec.exec('chmod', ['+x', binaryPath]);
  }
  
  // Cache for future use
  core.info('Caching DS binary...');
  cachedPath = await tc.cacheDir(extractedPath, 'ds', actualVersion);
  
  return { path: cachedPath, version: actualVersion };
}

/**
 * Install plugins
 */
async function installPlugins(dsPath: string, pluginsList: string, registry: string): Promise<void> {
  if (!pluginsList || pluginsList.trim() === '') {
    core.info('No plugins to install');
    return;
  }
  
  const plugins = pluginsList.split(',').map(p => p.trim()).filter(p => p);
  const { binaryName } = getPlatformInfo();
  const dsBinary = path.join(dsPath, binaryName);
  
  for (const plugin of plugins) {
    core.info(`Installing plugin: ${plugin}`);
    
    const args = ['plugin', 'install', plugin];
    if (registry) {
      args.push('--registry', registry);
    }
    
    try {
      await exec.exec(dsBinary, args);
      core.info(`✓ Plugin ${plugin} installed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.warning(`Failed to install plugin ${plugin}: ${errorMessage}`);
    }
  }
}

/**
 * Main action entrypoint
 */
async function run(): Promise<void> {
  try {
    // Get inputs
    const version = core.getInput('version') || 'latest';
    const plugins = core.getInput('plugins') || '';
    const registry = core.getInput('registry') || '';
    const token = core.getInput('token') || process.env.GITHUB_TOKEN || '';
    
    // Download and setup DS
    const { path: dsPath, version: installedVersion } = await downloadDS(version, token);
    
    // Add to PATH
    core.addPath(dsPath);
    core.info(`Added ${dsPath} to PATH`);
    
    // Set outputs
    core.setOutput('version', installedVersion);
    core.setOutput('path', dsPath);
    
    // Verify installation
    const { binaryName } = getPlatformInfo();
    const dsBinary = path.join(dsPath, binaryName);
    await exec.exec(dsBinary, ['version']);
    
    // Install plugins if specified
    if (plugins) {
      await installPlugins(dsPath, plugins, registry);
    }
    
    core.info('✓ DS setup completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(errorMessage);
  }
}

run();
