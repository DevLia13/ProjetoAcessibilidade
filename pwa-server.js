/**
 * Servidor Local para Testar e Instalar o Aplicativo no Celular (Android / iOS)
 * Permite acesso na mesma rede Wi-Fi e instalação como PWA nativo
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // Remove trailing slashes
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Arquivo Não Encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('===============================================================');
  console.log('  PROJETO ACESSIBILIDADE • APLICATIVO MOBILE (PWA)');
  console.log('===============================================================');
  console.log(`\n  🖥️  Acesso no Computador:`);
  console.log(`      http://localhost:${PORT}`);
  
  const ips = getLocalIpAddresses();
  if (ips.length > 0) {
    console.log(`\n  📱 Acesso no Celular (Android / iPhone conectado ao mesmo Wi-Fi):`);
    ips.forEach(ip => {
      console.log(`      http://${ip}:${PORT}`);
    });
  }
  console.log('\n  📲 COMO INSTALAR NO CELULAR:');
  console.log('  • Android: Abra o link no Chrome e toque no aviso "Instalar Aplicativo"');
  console.log('             ou no menu (3 pontos) > "Adicionar à tela inicial".');
  console.log('  • iPhone:  Abra o link no Safari, toque no botão Compartilhar [⎋]');
  console.log('             e selecione "Adicionar à Tela de Início" [+]');
  console.log('\n===============================================================');
  console.log('  Pressione Ctrl+C para encerrar o servidor.');
});
