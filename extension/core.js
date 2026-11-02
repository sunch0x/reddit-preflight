export const LABELS={pending:'Not checked',checking:'Checking',form_open:'Form opens',blocked:'Account requirement',restricted:'Approval required',unavailable:'Community unavailable',unknown:'Needs review',login:'Sign in required',rate_limit:'Rate limited',challenge:'Browser check',user_confirmed:'Manually confirmed',manual_bad:'Manually excluded',session_changed:'Account changed'};
export const REASONS={age:'Account age',karma:'Karma','age+karma':'Account age and karma',activity:'Account activity',approval:'Moderator approval',private:'Private community',other:'Other',missing:'Unavailable community',media:'Media or link required'};
export function normalizeCommunity(input){
 let v=String(input||'').trim();
 if(/^https?:/i.test(v)){try{const u=new URL(v);if(!['www.reddit.com','reddit.com'].includes(u.hostname)||u.username||u.password)return null;v=u.pathname;}catch{return null;}}
 v=v.replace(/^\/?r\//i,'').replace(/\/(?:submit\/?)?$/i,'');
 return /^[A-Za-z0-9_]{2,30}$/.test(v)?v:null;
}
export function parseCommunities(text){
 const names=[],invalid=[],seen=new Set();
 for(const value of String(text).split(/[\s,;]+/).filter(Boolean)){
  const name=normalizeCommunity(value);if(!name){invalid.push(value);continue;}
  if(!seen.has(name.toLowerCase())){names.push(name);seen.add(name.toLowerCase());}
 }
 return {names,invalid};
}
export function isCommunitySearchURL(value){try{const u=new URL(value);return u.origin==='https://www.reddit.com'&&/^\/search\/?$/.test(u.pathname)&&['communities','sr'].includes(u.searchParams.get('type'));}catch{return false;}}
export function mergeCollected(rows,names){
 const seen=new Set(rows.map(r=>r.name.toLowerCase()));let n=0;
 for(const value of names){const name=normalizeCommunity(value);if(!name||seen.has(name.toLowerCase())||rows.length>=1000)continue;rows.push({name,status:'pending'});seen.add(name.toLowerCase());n++;}return n;
}
export function resolveAccount(snapshot){
 const names=[...new Set((snapshot.accountCandidates||[]).map(s=>String(s).match(/^\/?u\/([A-Za-z0-9_-]{3,30})\/?$/i)?.[1]).filter(Boolean))];
 return names.length===1?names[0]:'';
}
export function sessionConflict(before,after){return Boolean(before&&after&&before.toLowerCase()!==after.toLowerCase());}
export function isOwnedURL(actual,expected){try{const a=new URL(actual),b=new URL(expected);return a.origin==='https://www.reddit.com'&&a.origin===b.origin&&a.pathname.replace(/\/$/,'').toLowerCase()===b.pathname.replace(/\/$/,'').toLowerCase()&&a.search===b.search;}catch{return false;}}
export function classify(s){
 const text=String(s.text||''),gate=String(s.gateText||'');
 const personalError=/you can(?:not|'t|’t) contribute in this community yet|your account isn.t old enough|your account is not old enough|вы пока не можете публиковать/i.test(text)?text:'';
 const g=(gate+'\n'+personalError).toLowerCase(),all=(text+'\n'+gate).toLowerCase();
 const result=(status,reason,evidence)=>({status,reason,evidence:String(evidence||gate||text).trim().slice(0,1800)});
 if(s.challenge)return result('challenge','other','Reddit requested a browser / human verification check');
 if(/too many requests|http\s*429|you(?:'|’)re doing that too much|try again in \d+ minutes|слишком много запросов/.test(all))return result('rate_limit','other',text||gate);
 if(s.authDialog||/reddit\.com\/(?:login|register)(?:[/?]|$)/.test(s.url||''))return result('login','other','Reddit is requesting sign-in');
 if(/that community doesn.t exist|community not found|this community has been banned|сообщество не существует/.test(g)||s.communityUnavailable)return result('unavailable','missing',gate||text);
 if(/private community|это закрытое сообщество/.test(all))return result('restricted','private',gate||text);
 if(/only approved users|request to post|request approval|только одобренные|запросить разрешение/.test(g))return result('restricted','approval',gate);
 if(/can(?:not|'t|’t) contribute|can(?:not|'t|’t) post|not eligible|not allowed to post|activity requirements|не можете публиковать|не можете участвовать|не можете создавать|недостаточно.*карм|account.*not.*old enough|account.*isn.t.*old enough/.test(g)){
  const age=/old enough|account age|come back later|слишком нов|возраст|аккаунт.*молод/.test(g),karma=/karma|карм/.test(g);
  return result('blocked',age&&karma?'age+karma':age?'age':karma?'karma':'activity',gate||personalError);
 }
 if(s.titleField&&s.mediaRequirement&&/reddit\.com\/r\/[A-Za-z0-9_]+\/submit\/?(?:[?#]|$)/.test(s.url||''))return result('form_open','media',s.mediaRequirement+' The title is editable; add the required content before posting. Submission and moderation were not tested.');
 if(/reddit\.com\/r\/[A-Za-z0-9_]+\/submit\/?(?:[?#]|$)/.test(s.url||'')&&s.titleField&&s.editor)return result('form_open','','Editable title and body were found. Submission and moderation were not tested; hidden or later restrictions may still apply.');
 return result('unknown','other',gate||'No conclusive restriction or complete editable composer was found. Review this community manually.');
}
export function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const fields=['name','status','reason','evidence','checkedAt','account','note','url'];
export function exportCSV(rows){const cell=v=>'"'+String(v??'').replace(/^[\s]*[=+@-]/,m=>"'"+m).replaceAll('"','""')+'"';return '\uFEFF'+[fields.join(','),...rows.map(r=>fields.map(k=>cell(r[k])).join(','))].join('\r\n');}
export function exportHTML(rows){
 const e=escapeHTML;
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reddit Preflight report</title><style>body{font:14px/1.6 system-ui;margin:32px;background:#101918;color:#e8dfc9}h1{letter-spacing:-.04em}p{color:#a6b0a4}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:14px;border-bottom:1px solid #30333b;vertical-align:top;max-width:480px;overflow-wrap:anywhere}th{background:#182321}a{color:#d6c394}.scroll{overflow:auto}footer{margin-top:30px}</style><h1>Reddit Preflight</h1><p>'+e(new Date().toISOString())+' / '+rows.length+' communities</p><p>An open form is not posting permission. This report only records visible form states and restrictions. Hidden filters, submission-time checks and moderation were not tested. Account identity is shown only when the page exposed an explicit identifier.</p><div class="scroll"><table><thead><tr><th>Community</th><th>Observation</th><th>Reason</th><th>Evidence</th><th>Checked at</th><th>Detected account</th><th>Note</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><a href="https://www.reddit.com/r/'+e(normalizeCommunity(r.name)||'unknown')+'/">r/'+e(r.name)+'</a></td><td>'+e(LABELS[r.status]||r.status)+'</td><td>'+e(REASONS[r.reason]||r.reason)+'</td><td>'+e(r.evidence)+'</td><td>'+e(r.checkedAt)+'</td><td>'+e(r.account||'Not identified')+'</td><td>'+e(r.note)+'</td></tr>').join('')+'</tbody></table></div><footer>Made by <a href="https://linkdeck.co/sunch0x">sunch0x</a></footer></html>';
}
export function validateBackup(data){
 if(data?.schema!==2||!Array.isArray(data.rows)||data.rows.length>1000)throw Error('Not a Reddit Preflight backup');
 const seen=new Set();
 const rows=data.rows.map(r=>{
  if(normalizeCommunity(r.name)!==r.name||!Object.hasOwn(LABELS,r.status)||seen.has(r.name.toLowerCase()))throw Error('Invalid or duplicate community in backup');
  seen.add(r.name.toLowerCase());
  return {name:r.name,status:r.status==='checking'?'pending':r.status,reason:String(r.reason||'').slice(0,50),evidence:String(r.evidence||'').slice(0,1800),checkedAt:String(r.checkedAt||'').slice(0,50),account:String(r.account||'').slice(0,40),note:String(r.note||'').slice(0,1000),url:'https://www.reddit.com/r/'+r.name+'/submit/'};
 });
 return {schema:2,rows,account:String(data.account||'').slice(0,40),workerTabId:null,workerUrl:'',runState:'paused'};
}
