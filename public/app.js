const panels = {
  auth: document.getElementById('auth'),
  products: document.getElementById('products'),
  customers: document.getElementById('customers'),
  sales: document.getElementById('sales')
};

function show(panel){
  Object.values(panels).forEach(p=>p.classList.add('hidden'));
  panels[panel].classList.remove('hidden');
}

document.getElementById('btn-products').addEventListener('click', ()=>{ show('products'); fetchProducts(); });
document.getElementById('btn-customers').addEventListener('click', ()=>{ show('customers'); fetchCustomers(); });
document.getElementById('btn-sales').addEventListener('click', ()=>{ show('sales'); fetchSales(); });
document.getElementById('btn-auth').addEventListener('click', ()=>{ show('auth'); });

async function fetchProducts(){
  const res = await fetch('/api/products');
  const data = await res.json();
  const ul = document.getElementById('product-list'); ul.innerHTML='';
  data.forEach(p=>{ const li=document.createElement('li'); li.textContent = `${p.ProductCode || p.productCode || ''} — ${p.productName} ($${p.unitPrice})`; ul.appendChild(li); });
}

async function fetchCustomers(){
  const res = await fetch('/api/customers');
  const data = await res.json();
  const ul = document.getElementById('customer-list'); ul.innerHTML='';
  data.forEach(c=>{ const li=document.createElement('li'); li.textContent = `${c.CustomerNumber || ''} — ${c.firstName} ${c.lastName} (${c.telephone})`; ul.appendChild(li); });
}

async function fetchSales(){
  const res = await fetch('/api/sales');
  const data = await res.json();
  const ul = document.getElementById('sales-list'); ul.innerHTML='';
  data.forEach(s=>{ const li=document.createElement('li'); li.textContent = `#${s.InvoiceNumber} — ${s.salesDate} — ${s.firstName || ''} ${s.lastName || ''} — ${s.totalAmountPaid}`; ul.appendChild(li); });
}

// auth
document.getElementById('login-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());
  const res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const json = await res.json();
  document.getElementById('auth-msg').textContent = json.message || json.error || JSON.stringify(json);
  if (res.ok && json.token) localStorage.setItem('srms_token', json.token);
});

document.getElementById('register-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());
  const res = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const json = await res.json();
  document.getElementById('auth-msg').textContent = json.message || json.error || JSON.stringify(json);
});

// add product
document.getElementById('add-product-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());
  const res = await fetch('/api/products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const json = await res.json();
  document.getElementById('products-msg').textContent = json.message || json.error || JSON.stringify(json);
  if (res.ok) fetchProducts();
});

// init
show('products'); fetchProducts();
