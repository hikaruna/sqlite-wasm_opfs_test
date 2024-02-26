const p = document.createElement('p');
p.textContent = "hello"; 
document.body.appendChild(p);
const worker = new Worker('worker.js', { type: 'module' });

