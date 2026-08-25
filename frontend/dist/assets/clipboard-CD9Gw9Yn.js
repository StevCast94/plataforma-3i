import{c as r}from"./index-KiHH4goU.js";/**
 * @license lucide-react v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],n=r("smartphone",a);async function i(t){if(!t)return!1;if(navigator.clipboard&&window.isSecureContext)try{return await navigator.clipboard.writeText(t),!0}catch{}try{const e=document.createElement("textarea");e.value=t,e.setAttribute("readonly",""),e.style.position="fixed",e.style.left="-9999px",e.style.top="0",document.body.appendChild(e),e.focus(),e.select(),e.setSelectionRange(0,t.length);const o=document.execCommand("copy");return document.body.removeChild(e),o}catch{return!1}}export{n as S,i as c};
