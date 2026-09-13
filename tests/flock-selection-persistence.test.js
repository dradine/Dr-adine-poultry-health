const fs = require('fs');

const js = fs.readFileSync('professional-farm.js', 'utf8');

if (!js.includes("localStorage.getItem('adine_selected_flock')")) {
  throw new Error('Flock selection persistence guard: stored flock id is not read.');
}
if (!js.includes("params.get('flockId') || params.get('flock')")) {
  throw new Error('Flock selection persistence guard: URL flock id is not read.');
}
if (!js.includes("flockSelect.value = storedFlockId")) {
  throw new Error('Flock selection persistence guard: selector is not restored to stored flock.');
}
if (!js.includes("flockSelect.addEventListener('change',updateLinks)")) {
  throw new Error('Flock selection persistence guard: change listener is missing.');
}

console.log('PASS: flock selection persistence guards');
