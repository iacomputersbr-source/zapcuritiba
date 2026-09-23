const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let licencias = [
  { codigo: 'ZC-CUR-2026-BATEL-001', cliente: 'Pizzaria Batel', estado: 'activa', fecha: '23/09/2026' },
  { codigo: 'ZC-CUR-2026-AGUA-002', cliente: 'Salon Agua Verde', estado: 'activa', fecha: '23/09/2026' }
];

app.get('/api/health', (req,res)=> res.json({status:'LIVE', service:'ZapCuritiba', version:'1.0'}));
app.get('/api/licencias', (req,res)=> res.json(licencias));
app.post('/api/licencias', (req,res)=>{
  const cliente = req.body.cliente || 'Cliente';
  const codigo = `ZC-CUR-2026-${cliente.substring(0,4).toUpperCase()}-${Math.floor(Math.random()*900)+100}`;
  const nueva = {codigo, cliente, estado:'activa', fecha: new Date().toLocaleDateString('pt-BR')};
  licencias.push(nueva);
  res.json(nueva);
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/panel', (req,res)=> res.sendFile(path.join(__dirname,'public','panel.html')));

app.listen(PORT, ()=> console.log(`ZapCuritiba LIVE en puerto ${PORT}`));
