#!/usr/bin/env node
/**
 * SmartAuto Webhook Receiver
 * 监听 Gitee push 事件，自动触发生产部署
 * 
 * Gitee Code Ping 设置:
 *   POST https://lg-auto.com/webhook/deploy
 *   Content-Type: application/json
 *   Body: {"ref":"refs/heads/master","before":"...","after":"...","repository":{"name":"smartauto"}}
 */

const http = require('http');
const { execSync } = require('child_process');
const { existsSync } = require('fs');

const PORT = 6000;
const DEPLOY_LOG = '/tmp/smartauto-deploy.log';
const WORK_DIR = '/var/www/lugong/system-dev-src';

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  process.stdout.write(line);
  try {
    require('fs').appendFileSync(DEPLOY_LOG, line);
  } catch {}
}

function doDeploy() {
  log('[DEPLOY] Start deploy...');

  try {
    // 1. Pull latest
    execSync('git fetch origin master', { cwd: WORK_DIR });
    const status = execSync('git status', { cwd: WORK_DIR, encoding: 'utf8' });
    log('[DEPLOY] Git status: ' + status.trim().split('\n').slice(-3).join(' | '));

    const out = execSync('git reset --hard origin/master', { cwd: WORK_DIR, encoding: 'utf8' });
    log('[DEPLOY] Reset: ' + out.trim());

    // 2. Build
    const buildDir = `${WORK_DIR}/docs/system-dev`;
    log('[DEPLOY] npm install...');
    execSync('npm install --silent', { cwd: buildDir });

    log('[DEPLOY] npm run build...');
    execSync('npm run build', { cwd: buildDir });

    // 3. Sync to production
    log('[DEPLOY] Syncing to /var/www/lugong/system-dev/...');
    execSync('rm -rf /var/www/lugong/system-dev/*', { shell: '/bin/bash' });
    execSync(`cp -r ${buildDir}/dist/* /var/www/lugong/system-dev/`, { shell: '/bin/bash' });

    log('[DEPLOY] ✓ Deploy complete!');
    return { success: true, msg: 'Deploy OK' };
  } catch (err) {
    log('[DEPLOY] ✗ Error: ' + err.message);
    return { success: false, msg: err.message };
  }
}

const server = http.createServer((req, res) => {
  const url = req.url;
  log(`[${req.method}] ${url}`);

  // Health check
  if (url === '/health' || url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
    return;
  }

  // Deploy webhook: POST /webhook/deploy
  if (req.method === 'POST' && url === '/deploy') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        log('Webhook payload: ref=' + (payload.ref || '') + ' repo=' + (payload.repository?.name || ''));
      } catch {
        log('Webhook payload: (parse failed)');
      }

      if (!existsSync(WORK_DIR)) {
        log('[DEPLOY] ✗ WORK_DIR not found: ' + WORK_DIR);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'WORK_DIR not found' }));
        return;
      }

      // Run deploy asynchronously
      const result = doDeploy();
      res.writeHead(result.success ? 200 : 500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(result));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  log(`SmartAuto Webhook Receiver listening on :${PORT}`);
});