#!/usr/bin/env node

/**
 * GitHub Webhook Server
 * Listens for GitHub webhook events and triggers deployment
 * 
 * Usage:
 *   node scripts/webhook-server.js
 * 
 * Or with PM2:
 *   pm2 start scripts/webhook-server.js --name webhook-server
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key-change-this';
const DEPLOY_SCRIPT = path.join(__dirname, 'deploy.sh');

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function deploy() {
  console.log('🚀 Triggering deployment...');
  exec(`bash ${DEPLOY_SCRIPT}`, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Deployment failed:', error);
      return;
    }
    console.log('✅ Deployment output:', stdout);
    if (stderr) console.error('⚠️  Deployment warnings:', stderr);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];
      
      if (!signature) {
        console.warn('⚠️  No signature found');
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }
      
      if (!verifySignature(body, signature)) {
        console.warn('⚠️  Invalid signature');
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }
      
      try {
        const payload = JSON.parse(body);
        
        // Only deploy on push to main branch
        if (payload.ref === 'refs/heads/main' && payload.repository) {
          console.log('✅ Valid webhook received, deploying...');
          res.writeHead(200);
          res.end('OK');
          deploy();
        } else {
          console.log('ℹ️  Webhook received but not a main branch push, ignoring...');
          res.writeHead(200);
          res.end('OK');
        }
      } catch (error) {
        console.error('❌ Error parsing webhook:', error);
        res.writeHead(400);
        res.end('Bad Request');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🔔 Webhook server listening on port ${PORT}`);
  console.log(`📝 Configure GitHub webhook: http://your-server-ip:${PORT}/webhook`);
});

