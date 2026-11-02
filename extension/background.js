import {isCommunitySearchURL} from './core.js';
chrome.action.onClicked.addListener(async tab=>{
 if(isCommunitySearchURL(tab?.url))await chrome.storage.session.set({preflightSourceTab:tab.id});
 const url=chrome.runtime.getURL('dashboard.html');
 const tabs=await chrome.tabs.query({});
 const existing=tabs.find(t=>t.url===url);
 if(existing){await chrome.tabs.update(existing.id,{active:true});return;}
 await chrome.tabs.create({url});
});
