import fs from 'node:fs/promises';import path from 'node:path';import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');execFileSync(process.execPath,[path.join(root,'scripts/check.mjs')],{stdio:'inherit'});
const manifest=JSON.parse(await fs.readFile(path.join(root,'extension/manifest.json'),'utf8'));
await fs.mkdir(path.join(root,'dist'),{recursive:true});const out=path.join(root,'dist','reddit-preflight-'+manifest.version+'.zip');await fs.rm(out,{force:true});
// zip is available on macOS and the Ubuntu CI runner. Only extension runtime files are packaged.
execFileSync('zip',['-qr',out,'.'],{cwd:path.join(root,'extension')});console.log(out);
