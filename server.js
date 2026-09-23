const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

const ADMIN_USER = process.env.ADMIN_USER || 'iacomputersbr';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Imaru1972**';

const LICENSES_FILE = path.join(__dirname, 'licenses.json');

// Cargar licencias desde archivo para que no se borren
let licencias = [];
try {
  if (fs.existsSync(LICENSES_FILE)) {
    licencias = JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf8'));
  } else {
    licencias = [
      { codigo: 'ZC-CUR-2026-BATEL-001', cliente: 'Pizzaria Batel', estado: 'activa', fecha: '23/09/2026' },
      { codigo: 'ZC-CUR-2026-AGUA-002', cliente: 'Salon Agua Verde', estado: 'activa', fecha: '23/09/2026' }
    ];
    fs.writeFileSync(LICENSES_FILE, JSON.stringify(licencias, null, 2));
  }
} catch (e) {
  console.error('Error cargando licencias', e);
  licencias = [];
}

function saveLicencias() {
  try {
    fs.writeFileSync(LICENSES_FILE, JSON.stringify(licencias, null, 2));
  } catch (e) {
    console.error('Error guardando', e);
  }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// LOGIN
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Usuario o senha incorretos' });
  }
});

function checkAuth(req, res, next) {
  const authUser = req.headers['x-admin-user'];
  const authPass = req.headers['x-admin-pass'];
  if (authUser === ADMIN_USER && authPass === ADMIN_PASS) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'No autorizado - faca login' });
  }
}

app.get('/api/health', (req,res)=> res.json({status:'LIVE', service:'ZapCuritiba', version:'1.1 - Seguro'}));

app.get('/api/licencias', checkAuth, (req,res)=> res.json(licencias));

app.post('/api/licencias', checkAuth, (req,res)=>{
  const cliente = req.body.cliente || req.body.clientName || 'Cliente';
  if (!cliente || cliente.trim() === '') {
    return res.status(400).json({ success: false, message: 'Nome obrigatorio' });
  }
  const codigo = `ZC-CUR-2026-${cliente.substring(0,4).toUpperCase()}-${Math.floor(Math.random()*900)+100}`;
  const nueva = { codigo, cliente: cliente.trim(), estado:'activa', fecha: new Date().toLocaleDateString('pt-BR')};
  licencias.push(nueva);
  saveLicencias();
  res.json(nueva);
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/panel', (req,res)=> res.sendFile(path.join(__dirname,'public','panel.html')));
app.get('/panel.html', (req,res)=> res.sendFile(path.join(__dirname,'public','panel.html')));

app.listen(PORT, ()=> {
  console.log(`ZapCuritiba LIVE en puerto ${PORT}`);
  console.log(`Admin user: ${ADMIN_USER}`);
});
