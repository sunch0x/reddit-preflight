import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),ext=path.join(root,'extension'),manifest=JSON.parse(await fs.readFile(path.join(ext,'manifest.json'),'utf8'));
assert.equal(manifest.manifest_version,3);assert.deepEqual(manifest.host_permissions,['https://www.reddit.com/*']);assert.deepEqual(new Set(manifest.permissions),new Set(['storage','scripting']));
assert.ok(manifest.description.length<=132,'Manifest description must fit Chrome’s 132-character limit');
for(const f of await fs.readdir(ext)){if(f.endsWith('.js'))execFileSync(process.execPath,['--check',path.join(ext,f)]);}
for(const size of [16,32,48,128])assert.ok((await fs.stat(path.join(ext,'icons',size+'.png'))).size>0);
const html=await fs.readFile(path.join(ext,'dashboard.html'),'utf8');assert.match(html,/https:\/\/linkdeck.co\/sunch0x/);assert.match(html,/https:\/\/unison.ink/);assert.doesNotMatch(html,/id="account"|id="delay"/);
const source=(await Promise.all((await fs.readdir(ext)).filter(f=>f.endsWith('.js')).map(f=>fs.readFile(path.join(ext,f),'utf8')))).join('\n');
assert.doesNotMatch(source,/chrome\.cookies|document\.cookie|fetch\(|XMLHttpRequest|eval\(|new Function\(/);
assert.doesNotMatch((await fs.readdir(ext)).join(','),/communities\.json|results\.csv|backup\.json/);
assert.doesNotMatch(await fs.readFile(path.join(ext,'dashboard.js'),'utf8'),/[А-Яа-яЁё]/);
console.log('Manifest, syntax, icons, attribution links, no required name/delay, no network clients and clean public defaults: OK');
