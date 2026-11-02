import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,parseCommunities,resolveAccount,sessionConflict,exportCSV,exportHTML,validateBackup,isOwnedURL} from '../extension/core.js';
const s=(extra={})=>({url:'https://www.reddit.com/r/example/submit/',text:'',gateText:'',titleField:false,editor:false,...extra});
test('detects account-age gate even when composer is still visible',()=>{
 const r=classify(s({titleField:true,editor:true,gateText:"You can't contribute in this community yet. Your account isn't old enough yet. undefined is 3 days old."}));
 assert.equal(r.status,'blocked');assert.equal(r.reason,'age');assert.match(r.evidence,/3 days/);assert.doesNotMatch(r.evidence,/minimum/);
});
test('karma and mixed gates remain distinct',()=>{
 assert.equal(classify(s({gateText:"You can't contribute yet. Earn karma."})).reason,'karma');
 assert.equal(classify(s({gateText:"You can't contribute yet. Come back later. Earn karma."})).reason,'age+karma');
});
test('body-only personal eligibility error overrides a visible composer',()=>assert.equal(classify(s({titleField:true,editor:true,text:"You can't contribute in this community yet. Your account isn't old enough yet."})).status,'blocked'));
test('missing community reported instead of open form',()=>assert.equal(classify(s({titleField:true,editor:true,gateText:"Hmm, that community doesn't exist. Try checking the spelling."})).status,'unavailable'));
test('sidebar rules about karma are not personal blocking signals',()=>assert.equal(classify(s({text:'Rules: your account must have 100 karma',titleField:true,editor:true})).status,'form_open'));
test('approval gate takes precedence over editor',()=>assert.equal(classify(s({titleField:true,editor:true,gateText:'Request to Post'})).status,'restricted'));
test('a login requirement overrides fields',()=>assert.equal(classify(s({authDialog:true,titleField:true,editor:true})).status,'login'));
test('login link in site header alone does not prove a login wall',()=>assert.equal(classify(s({text:'Log In'})).status,'unknown'));
test('rate limit and challenges stop the run',()=>{
 assert.equal(classify(s({text:'Too many requests'})).status,'rate_limit');
 assert.equal(classify(s({challenge:true})).status,'challenge');
});
test('a disabled empty-form submit button is not a block',()=>assert.equal(classify(s({titleField:true,editor:true,submitDisabled:true})).status,'form_open'));
test('no errors and one field are not enough',()=>{
 assert.equal(classify(s()).status,'unknown');assert.equal(classify(s({titleField:true})).status,'unknown');
});
test('wrong URL cannot prove availability',()=>assert.equal(classify(s({url:'https://www.reddit.com/',titleField:true,editor:true})).status,'unknown'));
test('parse pasted names and URLs, deduplicate, reject other hosts and invalid paths',()=>{
 const r=parseCommunities('r/SaaS\nhttps://www.reddit.com/r/socialmedia/submit/\nsaas, https://evil.com/r/test\n../oops');
 assert.deepEqual(r.names,['SaaS','socialmedia']);assert.equal(r.invalid.length,2);
});
test('account resolution only uses explicit account metadata',()=>{
 assert.equal(resolveAccount({accountCandidates:['u/actual_user']}),'actual_user');
 assert.equal(resolveAccount({accountCandidates:['Home','Open user menu']}),'');
 assert.equal(resolveAccount({text:'u/random_author',accountCandidates:[]}),'');
});
test('known session switches are detected case-insensitively',()=>{
 assert.equal(sessionConflict('first','second'),true);assert.equal(sessionConflict('USER','user'),false);assert.equal(sessionConflict('user',''),false);
});
test('ownership ignores only a trailing slash, never different community or host',()=>{
 assert.equal(isOwnedURL('https://www.reddit.com/r/test/submit','https://www.reddit.com/r/test/submit/'),true);
 assert.equal(isOwnedURL('https://www.reddit.com/r/other/submit/','https://www.reddit.com/r/test/submit/'),false);
 assert.equal(isOwnedURL('https://evil.com/r/test/submit/','https://www.reddit.com/r/test/submit/'),false);
});
test('CSV protects spreadsheet formulas, HTML escapes evidence',()=>{
 assert.match(exportCSV([{name:'example',status:'unknown',evidence:'=HYPERLINK("x")'}]),/'=HYPERLINK/);
 const h=exportHTML([{name:'example',status:'unknown',evidence:'<script>x</script>'}]);assert.doesNotMatch(h,/<script>x/);assert.match(h,/&lt;script&gt;/);
});
test('backup validation rejects duplicates and unknown states, strips runtime tab ownership',()=>{
 assert.throws(()=>validateBackup({schema:2,rows:[{name:'a_valid',status:'mystery'}]}));
 assert.throws(()=>validateBackup({schema:2,rows:[{name:'Example',status:'pending'},{name:'example',status:'pending'}]}));
 const r=validateBackup({schema:2,rows:[{name:'example',status:'pending'}],workerTabId:99});assert.equal(r.workerTabId,null);
});

test('media-only composer reports a content requirement, not an account block',()=>{
 const r=classify(s({titleField:true,mediaRequirement:'This community requires you to add an image, video, or link'}));
 assert.equal(r.status,'form_open');assert.equal(r.reason,'media');assert.match(r.evidence,/image, video, or link/);
});
test('media requirement alone or on the wrong page cannot prove an open composer',()=>{
 assert.equal(classify(s({mediaRequirement:'This community requires you to add an image, video, or link'})).status,'unknown');
 assert.equal(classify(s({url:'https://www.reddit.com/',titleField:true,mediaRequirement:'This community requires you to add an image, video, or link'})).status,'unknown');
});
test('account restrictions still override a media requirement',()=>assert.equal(classify(s({titleField:true,mediaRequirement:'This community requires you to add an image, video, or link',gateText:"You cannot contribute in this community yet. Your account is not old enough"})).status,'blocked'));
