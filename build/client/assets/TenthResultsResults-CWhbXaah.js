import{j as g}from"./jsx-runtime-0DLF9kdB.js";import{t as Ue,S as Pe,z as F,U as V,B as me,s as ve,E as Fe,T as He,V as Le}from"./index-CXkGJJD_.js";import{j as M,i as k,a as $e,b as ze,r as pe,c as X,g as Ie,e as U,f as Ve,h as O,k as Xe,s as J,l as Ke,m as qe,n as Je,o as Z,p as Q,S as ge,q as We,t as Be,u as Ge,v as Ye,w as Ze}from"./single-fetch-CTsUFmGk.js";var A={};/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */var ee;function Qe(){if(ee)return A;ee=1,A.parse=s,A.serialize=f;var e=Object.prototype.toString,r=Object.prototype.hasOwnProperty,n=/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/,t=/^("?)[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*\1$/,a=/^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i,i=/^[\u0020-\u003A\u003D-\u007E]*$/;function s(d,m){if(typeof d!="string")throw new TypeError("argument str must be a string");var c={},b=d.length;if(b<2)return c;var y=m&&m.decode||h,u=0,x=0,S=0;do{if(x=d.indexOf("=",u),x===-1)break;if(S=d.indexOf(";",u),S===-1)S=b;else if(x>S){u=d.lastIndexOf(";",x-1)+1;continue}var R=o(d,u,x),E=l(d,x,R),Y=d.slice(R,E);if(!r.call(c,Y)){var j=o(d,x+1,S),L=l(d,S,j);d.charCodeAt(j)===34&&d.charCodeAt(L-1)===34&&(j++,L--);var Ne=d.slice(j,L);c[Y]=p(Ne,y)}u=S+1}while(u<b);return c}function o(d,m,c){do{var b=d.charCodeAt(m);if(b!==32&&b!==9)return m}while(++m<c);return c}function l(d,m,c){for(;m>c;){var b=d.charCodeAt(--m);if(b!==32&&b!==9)return m+1}return c}function f(d,m,c){var b=c&&c.encode||encodeURIComponent;if(typeof b!="function")throw new TypeError("option encode is invalid");if(!n.test(d))throw new TypeError("argument name is invalid");var y=b(m);if(!t.test(y))throw new TypeError("argument val is invalid");var u=d+"="+y;if(!c)return u;if(c.maxAge!=null){var x=Math.floor(c.maxAge);if(!isFinite(x))throw new TypeError("option maxAge is invalid");u+="; Max-Age="+x}if(c.domain){if(!a.test(c.domain))throw new TypeError("option domain is invalid");u+="; Domain="+c.domain}if(c.path){if(!i.test(c.path))throw new TypeError("option path is invalid");u+="; Path="+c.path}if(c.expires){var S=c.expires;if(!w(S)||isNaN(S.valueOf()))throw new TypeError("option expires is invalid");u+="; Expires="+S.toUTCString()}if(c.httpOnly&&(u+="; HttpOnly"),c.secure&&(u+="; Secure"),c.partitioned&&(u+="; Partitioned"),c.priority){var R=typeof c.priority=="string"?c.priority.toLowerCase():c.priority;switch(R){case"low":u+="; Priority=Low";break;case"medium":u+="; Priority=Medium";break;case"high":u+="; Priority=High";break;default:throw new TypeError("option priority is invalid")}}if(c.sameSite){var E=typeof c.sameSite=="string"?c.sameSite.toLowerCase():c.sameSite;switch(E){case!0:u+="; SameSite=Strict";break;case"lax":u+="; SameSite=Lax";break;case"strict":u+="; SameSite=Strict";break;case"none":u+="; SameSite=None";break;default:throw new TypeError("option sameSite is invalid")}}return u}function h(d){return d.indexOf("%")!==-1?decodeURIComponent(d):d}function w(d){return e.call(d)==="[object Date]"}function p(d,m){try{return m(d)}catch{return d}}return A}var te=Qe();/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const re={};function ye(e,r){!e&&!re[r]&&(re[r]=!0,console.warn(r))}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const et=({sign:e,unsign:r})=>(n,t={})=>{let{secrets:a=[],...i}={path:"/",sameSite:"lax",...t};return ot(n,i.expires),{get name(){return n},get isSigned(){return a.length>0},get expires(){return typeof i.maxAge<"u"?new Date(Date.now()+i.maxAge*1e3):i.expires},async parse(s,o){if(!s)return null;let l=te.parse(s,{...i,...o});return n in l?l[n]===""?"":await rt(r,l[n],a):null},async serialize(s,o){return te.serialize(n,s===""?"":await tt(e,s,a),{...i,...o})}}},W=e=>e!=null&&typeof e.name=="string"&&typeof e.isSigned=="boolean"&&typeof e.parse=="function"&&typeof e.serialize=="function";async function tt(e,r,n){let t=nt(r);return n.length>0&&(t=await e(t,n[0])),t}async function rt(e,r,n){if(n.length>0){for(let t of n){let a=await e(r,t);if(a!==!1)return ne(a)}return null}return ne(r)}function nt(e){return btoa(it(encodeURIComponent(JSON.stringify(e))))}function ne(e){try{return JSON.parse(decodeURIComponent(at(atob(e))))}catch{return{}}}function at(e){let r=e.toString(),n="",t=0,a,i;for(;t<r.length;)a=r.charAt(t++),/[\w*+\-./@]/.exec(a)?n+=a:(i=a.charCodeAt(0),i<256?n+="%"+ae(i,2):n+="%u"+ae(i,4).toUpperCase());return n}function ae(e,r){let n=e.toString(16);for(;n.length<r;)n="0"+n;return n}function it(e){let r=e.toString(),n="",t=0,a,i;for(;t<r.length;){if(a=r.charAt(t++),a==="%"){if(r.charAt(t)==="u"){if(i=r.slice(t+1,t+5),/^[\da-f]{4}$/i.exec(i)){n+=String.fromCharCode(parseInt(i,16)),t+=5;continue}}else if(i=r.slice(t,t+2),/^[\da-f]{2}$/i.exec(i)){n+=String.fromCharCode(parseInt(i,16)),t+=2;continue}}n+=a}return n}function ot(e,r){ye(!r,`The "${e}" cookie has an "expires" property set. This will cause the expires value to not be updated when the session is committed. Instead, you should set the expires value when serializing the cookie. You can use \`commitSession(session, { expires })\` if using a session storage object, or \`cookie.serialize("value", { expires })\` if you're using the cookie directly.`)}function H(e){const r=unescape(encodeURIComponent(e));return Uint8Array.from(r,(n,t)=>r.charCodeAt(t))}function st(e){const r=String.fromCharCode.apply(null,e);return decodeURIComponent(escape(r))}function P(...e){const r=new Uint8Array(e.reduce((t,a)=>t+a.length,0));let n=0;for(const t of e)r.set(t,n),n+=t.length;return r}function lt(e,r){if(e.length!==r.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==r[n])return!1;return!0}function ie(e){return e instanceof Uint8Array?r=>e[r]:e}function $(e,r,n,t,a){const i=ie(e),s=ie(n);for(let o=0;o<a;++o)if(i(r+o)!==s(t+o))return!1;return!0}function ct(e){const r=new Array(256).fill(e.length);if(e.length>1)for(let n=0;n<e.length-1;n++)r[e[n]]=e.length-1-n;return r}const _=Symbol("Match");class B{constructor(r){this._lookbehind=new Uint8Array,typeof r=="string"?this._needle=r=H(r):this._needle=r,this._lastChar=r[r.length-1],this._occ=ct(r)}feed(r){let n=0,t;const a=[];for(;n!==r.length;)[n,...t]=this._feed(r,n),a.push(...t);return a}end(){const r=this._lookbehind;return this._lookbehind=new Uint8Array,r}_feed(r,n){const t=[];let a=-this._lookbehind.length;if(a<0){for(;a<0&&a<=r.length-this._needle.length;){const i=this._charAt(r,a+this._needle.length-1);if(i===this._lastChar&&this._memcmp(r,a,this._needle.length-1))return a>-this._lookbehind.length&&t.push(this._lookbehind.slice(0,this._lookbehind.length+a)),t.push(_),this._lookbehind=new Uint8Array,[a+this._needle.length,...t];a+=this._occ[i]}if(a<0)for(;a<0&&!this._memcmp(r,a,r.length-a);)a++;if(a>=0)t.push(this._lookbehind),this._lookbehind=new Uint8Array;else{const i=this._lookbehind.length+a;return i>0&&(t.push(this._lookbehind.slice(0,i)),this._lookbehind=this._lookbehind.slice(i)),this._lookbehind=Uint8Array.from(new Array(this._lookbehind.length+r.length),(s,o)=>this._charAt(r,o-this._lookbehind.length)),[r.length,...t]}}for(a+=n;a<=r.length-this._needle.length;){const i=r[a+this._needle.length-1];if(i===this._lastChar&&r[a]===this._needle[0]&&$(this._needle,0,r,a,this._needle.length-1))return a>n&&t.push(r.slice(n,a)),t.push(_),[a+this._needle.length,...t];a+=this._occ[i]}if(a<r.length){for(;a<r.length&&(r[a]!==this._needle[0]||!$(r,a,this._needle,0,r.length-a));)++a;a<r.length&&(this._lookbehind=r.slice(a))}return a>0&&t.push(r.slice(n,a<r.length?a:r.length)),[r.length,...t]}_charAt(r,n){return n<0?this._lookbehind[this._lookbehind.length+n]:r[n]}_memcmp(r,n,t){return $(this._charAt.bind(this,r),n,this._needle,0,t)}}class ut{constructor(r,n){this._readableStream=n,this._search=new B(r)}async*[Symbol.asyncIterator](){const r=this._readableStream.getReader();try{for(;;){const t=await r.read();if(t.done)break;yield*this._search.feed(t.value)}const n=this._search.end();n.length&&(yield n)}finally{r.releaseLock()}}}const dt=Function.prototype.apply.bind(P,void 0),we=H("--"),T=H(`\r
`);function ft(e){const r=e.split(";").map(t=>t.trim());if(r.shift()!=="form-data")throw new Error('malformed content-disposition header: missing "form-data" in `'+JSON.stringify(r)+"`");const n={};for(const t of r){const a=t.split("=",2);if(a.length!==2)throw new Error("malformed content-disposition header: key-value pair not found - "+t+" in `"+e+"`");const[i,s]=a;if(s[0]==='"'&&s[s.length-1]==='"')n[i]=s.slice(1,-1).replace(/\\"/g,'"');else if(s[0]!=='"'&&s[s.length-1]!=='"')n[i]=s;else if(s[0]==='"'&&s[s.length-1]!=='"'||s[0]!=='"'&&s[s.length-1]==='"')throw new Error("malformed content-disposition header: mismatched quotations in `"+e+"`")}if(!n.name)throw new Error("malformed content-disposition header: missing field name in `"+e+"`");return n}function ht(e){const r=[];let n=!1,t;for(;typeof(t=e.shift())<"u";){const a=t.indexOf(":");if(a===-1)throw new Error("malformed multipart-form header: missing colon");const i=t.slice(0,a).trim().toLowerCase(),s=t.slice(a+1).trim();switch(i){case"content-disposition":n=!0,r.push(...Object.entries(ft(s)));break;case"content-type":r.push(["contentType",s])}}if(!n)throw new Error("malformed multipart-form header: missing content-disposition");return Object.fromEntries(r)}async function mt(e,r){let n=!0,t=!1;const a=[[]],i=new B(T);for(;;){const s=await e.next();if(s.done)throw new Error("malformed multipart-form data: unexpected end of stream");if(n&&s.value!==_&&lt(s.value.slice(0,2),we))return[void 0,new Uint8Array];let o;if(s.value!==_)o=s.value;else if(!t)o=r;else throw new Error("malformed multipart-form data: unexpected boundary");if(!o.length)continue;n&&(n=!1);const l=i.feed(o);for(const[f,h]of l.entries()){const w=h===_;if(!(!w&&!h.length)){if(t&&w)return l.push(i.end()),[a.filter(p=>p.length).map(dt).map(st),P(...l.slice(f+1).map(p=>p===_?T:p))];(t=w)?a.push([]):a[a.length-1].push(h)}}}}async function*pt(e,r){const n=P(we,H(r)),t=new ut(n,e)[Symbol.asyncIterator]();for(;;){const i=await t.next();if(i.done)return;if(i.value===_)break}const a=new B(T);for(;;){let f=function(d){const m=[];for(const c of a.feed(d))l&&m.push(T),(l=c===_)||m.push(c);return P(...m)};const[i,s]=await mt(t,n);if(!i)return;async function o(){const d=await t.next();if(d.done)throw new Error("malformed multipart-form data: unexpected end of stream");return d}let l=!1,h=!1;async function w(){const d=await o();let m;if(d.value!==_)m=d.value;else if(!l)m=T;else return h=!0,{value:a.end()};return{value:f(m)}}const p=[{value:f(s)}];for(yield{...ht(i),data:{[Symbol.asyncIterator](){return this},async next(){for(;;){const d=p.shift();if(!d)break;if(d.value.length>0)return d}for(;;){if(h)return{done:h,value:void 0};const d=await w();if(d.value.length>0)return d}}}};!h;)p.push(await w())}}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function gt(...e){return async r=>{for(let n of e){let t=await n(r);if(typeof t<"u"&&t!==null)return t}}}async function yt(e,r){let n=e.headers.get("Content-Type")||"",[t,a]=n.split(/\s*;\s*boundary=/);if(!e.body||!a||t!=="multipart/form-data")throw new TypeError("Could not parse content as FormData.");let i=new FormData,s=pt(e.body,a);for await(let o of s){if(o.done)break;typeof o.filename=="string"&&(o.filename=o.filename.split(/[/\\]/).pop());let l=await r(o);typeof l<"u"&&l!==null&&i.append(o.name,l)}return i}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function wt(e){return Object.keys(e).reduce((r,n)=>(r[n]=e[n].module,r),{})}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function oe(e,r){if(e===!1||e===null||typeof e>"u")throw console.error("The following error is a bug in Remix; please open an issue! https://github.com/remix-run/remix/issues/new"),new Error(r)}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function K(e,r,n){let t=Ue(e,r,n);return t?t.map(a=>({params:a.params,pathname:a.pathname,route:a.route})):null}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */async function xt({loadContext:e,action:r,params:n,request:t,routeId:a,singleFetch:i}){let s=await r({request:i?Se(v(t)):xe(v(t)),context:e,params:n});if(s===void 0)throw new Error(`You defined an action for route "${a}" but didn't return anything from your \`action\` function. Please return a value or \`null\`.`);return i||k(s)?s:M(s)}async function St({loadContext:e,loader:r,params:n,request:t,routeId:a,singleFetch:i}){let s=await r({request:i?Se(v(t)):xe(v(t)),context:e,params:n});if(s===void 0)throw new Error(`You defined a loader for route "${a}" but didn't return anything from your \`loader\` function. Please return a value or \`null\`.`);return $e(s)?s.init&&ze(s.init.status||200)?pe(new Headers(s.init.headers).get("Location"),s.init):s:i||k(s)?s:M(s)}function v(e){let r=new URL(e.url),n=r.searchParams.getAll("index");r.searchParams.delete("index");let t=[];for(let i of n)i&&t.push(i);for(let i of t)r.searchParams.append("index",i);let a={method:e.method,body:e.body,headers:e.headers,signal:e.signal};return a.body&&(a.duplex="half"),new Request(r.href,a)}function xe(e){let r=new URL(e.url);r.searchParams.delete("_data");let n={method:e.method,body:e.body,headers:e.headers,signal:e.signal};return n.body&&(n.duplex="half"),new Request(r.href,n)}function Se(e){let r=new URL(e.url);r.searchParams.delete("_routes");let n={method:e.method,body:e.body,headers:e.headers,signal:e.signal};return n.body&&(n.duplex="half"),new Request(r.href,n)}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function be(e){let r={};return Object.values(e).forEach(n=>{let t=n.parentId||"";r[t]||(r[t]=[]),r[t].push(n)}),r}function Re(e,r="",n=be(e)){return(n[r]||[]).map(t=>({...t,children:Re(e,t.id,n)}))}function _e(e,r,n="",t=be(e)){return(t[n]||[]).map(a=>{let i={hasErrorBoundary:a.id==="root"||a.module.ErrorBoundary!=null,id:a.id,path:a.path,loader:a.module.loader?(s,o)=>St({request:s.request,params:s.params,loadContext:s.context,loader:a.module.loader,routeId:a.id,singleFetch:r.v3_singleFetch===!0}):void 0,action:a.module.action?(s,o)=>xt({request:s.request,params:s.params,loadContext:s.context,action:a.module.action,routeId:a.id,singleFetch:r.v3_singleFetch===!0}):void 0,handle:a.module.handle};return a.index?{index:!0,...i}:{caseSensitive:a.caseSensitive,children:_e(e,r,a.id,t),...i}})}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const bt={"&":"\\u0026",">":"\\u003e","<":"\\u003c","\u2028":"\\u2028","\u2029":"\\u2029"},Rt=/[&><\u2028\u2029]/g;function _t(e){return e.replace(Rt,r=>bt[r])}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function se(e){return _t(JSON.stringify(e))}var kt={};/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */async function Ct(e,r){if(r??(r=kt.REMIX_DEV_ORIGIN),!r)throw Error("Dev server origin not set");let n=new URL(r);n.pathname="ping";let t=await fetch(n.href,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({buildHash:e.assets.version})}).catch(a=>{throw console.error(`Could not reach Remix dev server at ${n}`),a});if(!t.ok)throw console.error(`Could not reach Remix dev server at ${n} (${t.status})`),Error(await t.text())}function Et(e){console.log(`[REMIX DEV] ${e.assets.version} ready`)}const ke="__remix_devServerHooks";function Dt(e){globalThis[ke]=e}function le(){return globalThis[ke]}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function Tt(e,r){return`⚠️ REMIX FUTURE CHANGE: Externally-accessed resource routes will no longer be able to return raw JavaScript objects or \`null\` in React Router v7 when Single Fetch becomes the default. You can prepare for this change at your convenience by wrapping the data returned from your \`${e}\` function in the \`${r}\` route with \`json()\`.  For instructions on making this change, see https://remix.run/docs/en/v2.13.1/guides/single-fetch#resource-routes`}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const Ce=new Set([100,101,204,205,304]);function ce(e,r){var n,t;let a=Re(e.routes),i=_e(e.routes,e.future),s=We(r)?r:O.Production,o=Pe(i,{basename:e.basename,future:{v7_relativeSplatPath:((n=e.future)===null||n===void 0?void 0:n.v3_relativeSplatPath)===!0,v7_throwAbortReason:((t=e.future)===null||t===void 0?void 0:t.v3_throwAbortReason)===!0}}),l=e.entry.module.handleError||((f,{request:h})=>{s!==O.Test&&!h.signal.aborted&&console.error(F(f)&&f.error?f.error:f)});return{routes:a,dataRoutes:i,serverMode:s,staticHandler:o,errorHandler:l}}const Ot=(e,r)=>{let n,t,a,i,s;return async function(l,f={}){if(n=typeof e=="function"?await e():e,r??(r=n.mode),typeof e=="function"){let u=ce(n,r);t=u.routes,a=u.serverMode,i=u.staticHandler,s=u.errorHandler}else if(!t||!a||!i||!s){let u=ce(n,r);t=u.routes,a=u.serverMode,i=u.staticHandler,s=u.errorHandler}let h=new URL(l.url),w={},p=u=>{if(r===O.Development){var x,S;(x=le())===null||x===void 0||(S=x.processRequestError)===null||S===void 0||S.call(x,u)}s(u,{context:f,params:w,request:l})},d=`${n.basename??"/"}/__manifest`.replace(/\/+/g,"/");if(h.pathname===d)try{return await Mt(n,t,h)}catch(u){return p(u),new Response("Unknown Server Error",{status:500})}let m=K(t,h.pathname,n.basename);m&&m.length>0&&Object.assign(w,m[0].params);let c;if(h.searchParams.has("_data")){n.future.v3_singleFetch&&p(new Error("Warning: Single fetch-enabled apps should not be making ?_data requests, this is likely to break in the future"));let u=h.searchParams.get("_data");c=await jt(a,n,i,u,l,f,p),n.entry.module.handleDataRequest&&(c=await n.entry.module.handleDataRequest(c,{context:f,params:w,request:l}),X(c)&&(c=Te(c,n.basename)))}else if(n.future.v3_singleFetch&&h.pathname.endsWith(".data")){let u=new URL(l.url);u.pathname=u.pathname.replace(/\.data$/,"").replace(/^\/_root$/,"/");let x=K(t,u.pathname,n.basename);if(c=await At(a,n,i,l,u,f,p),n.entry.module.handleDataRequest&&(c=await n.entry.module.handleDataRequest(c,{context:f,params:x?x[0].params:{},request:l}),X(c))){let S=Ie(c.status,c.headers,n.basename);l.method==="GET"&&(S={[ge]:S});let R=new Headers(c.headers);return R.set("Content-Type","text/x-script"),new Response(U(S,l.signal,n.entry.module.streamTimeout,a),{status:Ve,headers:R})}}else if(m&&m[m.length-1].route.module.default==null&&m[m.length-1].route.module.ErrorBoundary==null)c=await Ut(a,n,i,m.slice(-1)[0].route.id,l,f,p);else{var b,y;let u=r===O.Development?await((b=le())===null||b===void 0||(y=b.getCriticalCss)===null||y===void 0?void 0:y.call(b,n,h.pathname)):void 0;c=await Nt(a,n,i,l,f,p,u)}return l.method==="HEAD"?new Response(null,{headers:c.headers,status:c.status,statusText:c.statusText}):c}};async function Mt(e,r,n){if(e.assets.version!==n.searchParams.get("version"))return new Response(null,{status:204,headers:{"X-Remix-Reload-Document":"true"}});let t={};if(n.searchParams.has("p")){let a=new Set;n.searchParams.getAll("p").forEach(i=>{i.startsWith("/")||(i=`/${i}`);let s=i.split("/").slice(1);s.forEach((o,l)=>{let f=s.slice(0,l+1).join("/");a.add(`/${f}`)})});for(let i of a){let s=K(r,i,e.basename);if(s)for(let o of s){let l=o.route.id;t[l]=e.assets.routes[l]}}return M(t,{headers:{"Cache-Control":"public, max-age=31536000, immutable"}})}return new Response("Invalid Request",{status:400})}async function jt(e,r,n,t,a,i,s){try{let o=await n.queryRoute(a,{routeId:t,requestContext:i});if(X(o))return Te(o,r.basename);if(V in o){let l=o[V],f=Xe(l,a.signal,e),h=l.init||{},w=new Headers(h.headers);return w.set("Content-Type","text/remix-deferred"),w.set("X-Remix-Response","yes"),h.headers=w,new Response(f,h)}return o=q(o,"X-Remix-Response","yes"),o}catch(o){if(k(o))return q(o,"X-Remix-Catch","yes");if(F(o))return s(o),Ee(o,e);let l=o instanceof Error||o instanceof DOMException?o:new Error("Unexpected Server Error");return s(l),me(J(l,e),{status:500,headers:{"X-Remix-Error":"yes"}})}}async function At(e,r,n,t,a,i,s){let{result:o,headers:l,status:f}=t.method!=="GET"?await Ke(r,e,n,t,a,i,s):await qe(r,e,n,t,a,i,s),h=new Headers(l);return h.set("X-Remix-Response","yes"),Ce.has(f)?new Response(null,{status:f,headers:h}):(h.set("Content-Type","text/x-script"),new Response(U(o,t.signal,r.entry.module.streamTimeout,e),{status:f||200,headers:h}))}async function Nt(e,r,n,t,a,i,s){let o;try{o=await n.query(t,{requestContext:a})}catch(p){return i(p),new Response(null,{status:500})}if(k(o))return o;let l=Je(r,o);if(Ce.has(o.statusCode))return new Response(null,{status:o.statusCode,headers:l});o.errors&&(Object.values(o.errors).forEach(p=>{(!F(p)||p.error)&&i(p)}),o.errors=Z(o.errors,e));let f={loaderData:o.loaderData,actionData:o.actionData,errors:Q(o.errors,e)},h={manifest:r.assets,routeModules:wt(r.routes),staticHandlerContext:o,criticalCss:s,serverHandoffString:se({basename:r.basename,criticalCss:s,future:r.future,isSpaMode:r.isSpaMode,...r.future.v3_singleFetch?null:{state:f}}),...r.future.v3_singleFetch?{serverHandoffStream:U(f,t.signal,r.entry.module.streamTimeout,e),renderMeta:{}}:null,future:r.future,isSpaMode:r.isSpaMode,serializeError:p=>J(p,e)},w=r.entry.module.default;try{return await w(t,o.statusCode,l,h,a)}catch(p){i(p);let d=p;if(k(p))try{let c=await Pt(p);d=new Fe(p.status,p.statusText,c)}catch{}o=He(n.dataRoutes,o,d),o.errors&&(o.errors=Z(o.errors,e));let m={loaderData:o.loaderData,actionData:o.actionData,errors:Q(o.errors,e)};h={...h,staticHandlerContext:o,serverHandoffString:se({basename:r.basename,future:r.future,isSpaMode:r.isSpaMode,...r.future.v3_singleFetch?null:{state:m}}),...r.future.v3_singleFetch?{serverHandoffStream:U(m,t.signal,r.entry.module.streamTimeout,e),renderMeta:{}}:null};try{return await w(t,o.statusCode,l,h,a)}catch(c){return i(c),De(c,e)}}}async function Ut(e,r,n,t,a,i,s){try{let o=await n.queryRoute(a,{routeId:t,requestContext:i});return typeof o=="object"&&o!==null&&oe(!(V in o),`You cannot return a \`defer()\` response from a Resource Route.  Did you forget to export a default UI component from the "${t}" route?`),r.future.v3_singleFetch&&!k(o)&&(console.warn(Tt(a.method==="GET"?"loader":"action",t)),o=M(o)),oe(k(o),"Expected a Response to be returned from queryRoute"),o}catch(o){return k(o)?q(o,"X-Remix-Catch","yes"):F(o)?(o&&s(o),Ee(o,e)):(s(o),De(o,e))}}function Ee(e,r){return me(J(e.error||new Error("Unexpected Server Error"),r),{status:e.status,statusText:e.statusText,headers:{"X-Remix-Error":"yes"}})}function De(e,r){let n="Unexpected Server Error";return r!==O.Production&&(n+=`

${String(e)}`),new Response(n,{status:500,headers:{"Content-Type":"text/plain"}})}function Pt(e){let r=e.headers.get("Content-Type");return r&&/\bapplication\/json\b/.test(r)?e.body==null?null:e.json():e.text()}function Te(e,r){let n=new Headers(e.headers),t=n.get("Location");return n.set("X-Remix-Redirect",r&&ve(t,r)||t),n.set("X-Remix-Status",String(e.status)),n.delete("Location"),e.headers.get("Set-Cookie")!==null&&n.set("X-Remix-Revalidate","yes"),new Response(null,{status:204,headers:n})}function q(e,r,n){let t=new Headers(e.headers);return t.set(r,n),new Response(e.body,{status:e.status,statusText:e.statusText,headers:t,duplex:e.body?"half":void 0})}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function z(e){return`__flash_${e}__`}const G=(e={},r="")=>{let n=new Map(Object.entries(e));return{get id(){return r},get data(){return Object.fromEntries(n)},has(t){return n.has(t)||n.has(z(t))},get(t){if(n.has(t))return n.get(t);let a=z(t);if(n.has(a)){let i=n.get(a);return n.delete(a),i}},set(t,a){n.set(t,a)},flash(t,a){n.set(z(t),a)},unset(t){n.delete(t)}}},vt=e=>e!=null&&typeof e.id=="string"&&typeof e.data<"u"&&typeof e.has=="function"&&typeof e.get=="function"&&typeof e.set=="function"&&typeof e.flash=="function"&&typeof e.unset=="function",Ft=e=>({cookie:r,createData:n,readData:t,updateData:a,deleteData:i})=>{let s=W(r)?r:e((r==null?void 0:r.name)||"__session",r);return Oe(s),{async getSession(o,l){let f=o&&await s.parse(o,l),h=f&&await t(f);return G(h||{},f||"")},async commitSession(o,l){let{id:f,data:h}=o,w=(l==null?void 0:l.maxAge)!=null?new Date(Date.now()+l.maxAge*1e3):(l==null?void 0:l.expires)!=null?l.expires:s.expires;return f?await a(f,h,w):f=await n(h,w),s.serialize(f,l)},async destroySession(o,l){return await i(o.id),s.serialize("",{...l,maxAge:void 0,expires:new Date(0)})}}};function Oe(e){ye(e.isSigned,`The "${e.name}" cookie is not signed, but session cookies should be signed to prevent tampering on the client before they are sent back to the server. See https://remix.run/utils/cookies#signing-cookies for more information.`)}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const Ht=e=>({cookie:r}={})=>{let n=W(r)?r:e((r==null?void 0:r.name)||"__session",r);return Oe(n),{async getSession(t,a){return G(t&&await n.parse(t,a)||{})},async commitSession(t,a){let i=await n.serialize(t.data,a);if(i.length>4096)throw new Error("Cookie length will exceed browser maximum. Length: "+i.length);return i},async destroySession(t,a){return n.serialize("",{...a,maxAge:void 0,expires:new Date(0)})}}};/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const Lt=e=>({cookie:r}={})=>{let n=new Map;return e({cookie:r,async createData(t,a){let i=Math.random().toString(36).substring(2,10);return n.set(i,{data:t,expires:a}),i},async readData(t){if(n.has(t)){let{data:a,expires:i}=n.get(t);if(!i||i>new Date)return a;i&&n.delete(t)}return null},async updateData(t,a,i){n.set(t,{data:a,expires:i})},async deleteData(t){n.delete(t)}})};/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */class Me extends Error{constructor(r,n){super(`Field "${r}" exceeded upload size of ${n} bytes.`),this.field=r,this.maxBytes=n}}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function $t({filter:e,maxPartSize:r=3e6}={}){return async({filename:n,contentType:t,name:a,data:i})=>{if(e&&!await e({filename:n,contentType:t,name:a}))return;let s=0,o=[];for await(let l of i){if(s+=l.byteLength,s>r)throw new Me(a,r);o.push(l)}return typeof n=="string"?new File(o,n,{type:t}):await new Blob(o,{type:t}).text()}}/**
 * @remix-run/server-runtime v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const zt=Object.freeze(Object.defineProperty({__proto__:null,MaxPartSizeExceededError:Me,UNSAFE_SingleFetchRedirectSymbol:ge,broadcastDevReady:Ct,createCookieFactory:et,createCookieSessionStorageFactory:Ht,createMemorySessionStorageFactory:Lt,createRequestHandler:Ot,createSession:G,createSessionStorageFactory:Ft,data:Be,defer:Ge,isCookie:W,isSession:vt,json:M,logDevReady:Et,redirect:pe,redirectDocument:Ye,replace:Ze,unstable_composeUploadHandlers:gt,unstable_createMemoryUploadHandler:$t,unstable_parseMultipartFormData:yt,unstable_setDevServerHooks:Dt},Symbol.toStringTag,{value:"Module"}));var I={},N={},C={};const je=Le(zt);var D={};/**
 * @remix-run/cloudflare v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */var ue;function It(){if(ue)return D;ue=1,Object.defineProperty(D,"__esModule",{value:!0});const e=new TextEncoder,r=async(i,s)=>{let o=await t(s,["sign"]),l=e.encode(i),f=await crypto.subtle.sign("HMAC",o,l),h=btoa(String.fromCharCode(...new Uint8Array(f))).replace(/=+$/,"");return i+"."+h},n=async(i,s)=>{let o=i.lastIndexOf("."),l=i.slice(0,o),f=i.slice(o+1),h=await t(s,["verify"]),w=e.encode(l),p=a(atob(f));return await crypto.subtle.verify("HMAC",h,p,w)?l:!1};async function t(i,s){return await crypto.subtle.importKey("raw",e.encode(i),{name:"HMAC",hash:"SHA-256"},!1,s)}function a(i){let s=new Uint8Array(i.length);for(let o=0;o<i.length;o++)s[o]=i.charCodeAt(o);return s}return D.sign=r,D.unsign=n,D}/**
 * @remix-run/cloudflare v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */var de;function Ae(){if(de)return C;de=1,Object.defineProperty(C,"__esModule",{value:!0});var e=je,r=It();const n=e.createCookieFactory({sign:r.sign,unsign:r.unsign}),t=e.createCookieSessionStorageFactory(n),a=e.createSessionStorageFactory(n),i=e.createMemorySessionStorageFactory(a);return C.createCookie=n,C.createCookieSessionStorage=t,C.createMemorySessionStorage=i,C.createSessionStorage=a,C}/**
 * @remix-run/cloudflare v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */var fe;function Vt(){if(fe)return N;fe=1,Object.defineProperty(N,"__esModule",{value:!0});var e=Ae();function r({cookie:n,kv:t}){return e.createSessionStorage({cookie:n,async createData(a,i){for(;;){let s=new Uint8Array(8);crypto.getRandomValues(s);let o=[...s].map(l=>l.toString(16).padStart(2,"0")).join("");if(!await t.get(o,"json"))return await t.put(o,JSON.stringify(a),{expiration:i?Math.round(i.getTime()/1e3):void 0}),o}},async readData(a){let i=await t.get(a);return i?JSON.parse(i):null},async updateData(a,i,s){await t.put(a,JSON.stringify(i),{expiration:s?Math.round(s.getTime()/1e3):void 0})},async deleteData(a){await t.delete(a)}})}return N.createWorkersKVSessionStorage=r,N}/**
 * @remix-run/cloudflare v2.16.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */var he;function Xt(){return he||(he=1,function(e){Object.defineProperty(e,"__esModule",{value:!0});var r=Vt(),n=Ae(),t=je;e.createWorkersKVSessionStorage=r.createWorkersKVSessionStorage,e.createCookie=n.createCookie,e.createCookieSessionStorage=n.createCookieSessionStorage,e.createMemorySessionStorage=n.createMemorySessionStorage,e.createSessionStorage=n.createSessionStorage,Object.defineProperty(e,"MaxPartSizeExceededError",{enumerable:!0,get:function(){return t.MaxPartSizeExceededError}}),Object.defineProperty(e,"broadcastDevReady",{enumerable:!0,get:function(){return t.broadcastDevReady}}),Object.defineProperty(e,"createRequestHandler",{enumerable:!0,get:function(){return t.createRequestHandler}}),Object.defineProperty(e,"createSession",{enumerable:!0,get:function(){return t.createSession}}),Object.defineProperty(e,"data",{enumerable:!0,get:function(){return t.data}}),Object.defineProperty(e,"defer",{enumerable:!0,get:function(){return t.defer}}),Object.defineProperty(e,"isCookie",{enumerable:!0,get:function(){return t.isCookie}}),Object.defineProperty(e,"isSession",{enumerable:!0,get:function(){return t.isSession}}),Object.defineProperty(e,"json",{enumerable:!0,get:function(){return t.json}}),Object.defineProperty(e,"logDevReady",{enumerable:!0,get:function(){return t.logDevReady}}),Object.defineProperty(e,"redirect",{enumerable:!0,get:function(){return t.redirect}}),Object.defineProperty(e,"redirectDocument",{enumerable:!0,get:function(){return t.redirectDocument}}),Object.defineProperty(e,"replace",{enumerable:!0,get:function(){return t.replace}}),Object.defineProperty(e,"unstable_composeUploadHandlers",{enumerable:!0,get:function(){return t.unstable_composeUploadHandlers}}),Object.defineProperty(e,"unstable_createMemoryUploadHandler",{enumerable:!0,get:function(){return t.unstable_createMemoryUploadHandler}}),Object.defineProperty(e,"unstable_parseMultipartFormData",{enumerable:!0,get:function(){return t.unstable_parseMultipartFormData}})}(I)),I}Xt();function Wt({result:e,isInitialState:r,error:n,env:t}){var f,h,w,p,d,m,c,b;if(r)return g.jsx("div",{className:"w-full mx-auto p-4 text-black min-h-32 flex flex-col items-center justify-center"});if(n)return g.jsx("div",{className:"w-full mx-auto bg-white p-4 rounded-xl text-black shadow-lg",children:g.jsxs("div",{className:"p-4 rounded text-center",children:[g.jsx("h2",{className:"text-lg font-bold mb-2 text-red-600",children:"Error"}),g.jsx("p",{className:"mb-4 text-sm text-gray-700",children:n}),g.jsx("p",{className:"text-xs text-gray-500",children:"please try again later."})]})});if(!e)return g.jsx("div",{className:"w-full mx-auto bg-white p-4 rounded-xl text-gray-800 shadow-lg",children:g.jsxs("div",{className:"p-4 rounded text-center",children:[g.jsx("h2",{className:"text-lg font-bold mb-2",children:"Result Not Found"}),g.jsx("p",{className:"mb-4 text-sm text-gray-600",children:"No results found for the provided hall ticket number. Please check and try again."})]})});const i=[{name:"First Language",marks:e!=null&&e[t==null?void 0:t.firstLanguages10Marks]?e[t.firstLanguages10Marks].trim():"0",result:(e==null?void 0:e[t==null?void 0:t.firstLanguageResult])||"",grade:((f=e==null?void 0:e[t==null?void 0:t.lone])==null?void 0:f.trim())||""},{name:"Second Language",marks:e!=null&&e[t==null?void 0:t.secondLanguageMarks]?e[t.secondLanguageMarks].trim():"0",result:(e==null?void 0:e[t==null?void 0:t.secondLanguageResult])||"",grade:((h=e==null?void 0:e[t==null?void 0:t.l2Grade])==null?void 0:h.trim())||""},{name:"Third Language",marks:e!=null&&e[t==null?void 0:t.thirdLanguageMarks]?e[t.thirdLanguageMarks].trim():"0",result:(e==null?void 0:e[t==null?void 0:t.thirdLanguageResult])||"",grade:((w=e==null?void 0:e[t==null?void 0:t.l3Grade])==null?void 0:w.trim())||""},{name:"Mathematics",marks:e!=null&&e[t==null?void 0:t.mathematicsMarks]?e[t.mathematicsMarks].trim():"0",result:(e==null?void 0:e[t==null?void 0:t.mathematicsResult])||"",grade:((p=e==null?void 0:e[t==null?void 0:t.matgrade])==null?void 0:p.trim())||""},{name:"Science",marks:e!=null&&e[t==null?void 0:t.scienceMarks]?e[t.scienceMarks].trim():"0",result:(e==null?void 0:e[t==null?void 0:t.scienceResult])||"",grade:((d=e==null?void 0:e[t==null?void 0:t.scigrade])==null?void 0:d.trim())||""},{name:"Social Studies",marks:e!=null&&e[t==null?void 0:t.socialMarks]?e[t.socialMarks].trim():"0",result:(e==null?void 0:e[t==null?void 0:t.socialResult])||"",grade:((m=e==null?void 0:e[t==null?void 0:t.socgrade])==null?void 0:m.trim())||""}].filter(y=>{var x;const u=(x=y.marks)==null?void 0:x.trim();return u&&u!=="0"&&u!==""}),s=i.reduce((y,u)=>{const x=parseInt(u.marks)||0;return y+x},0),l=(y=>y?(y==null?void 0:y.toUpperCase()).includes("FAIL")?"text-red-600 font-bold":"text-green-600 font-bold":"text-gray-800")(e==null?void 0:e[t==null?void 0:t.result]);return g.jsxs("div",{className:"w-full mx-auto pt-1 pb-4 rounded-2xl text-gray-800 bg-white shadow-md",children:[g.jsx("div",{className:"px-4 mb-2",children:g.jsxs("div",{className:"grid grid-cols-[90px_1fr] gap-y-2 items-center",children:[g.jsx("span",{className:"font-bold",children:"Hall Ticket"}),g.jsxs("span",{className:"text-gray-600",children:[": ",e==null?void 0:e[t==null?void 0:t.hallticketNumber]]}),g.jsx("span",{className:"font-bold",children:"Name"}),g.jsxs("span",{className:"text-gray-600 break-words",children:[": ",(c=e==null?void 0:e[t==null?void 0:t.name])==null?void 0:c.trim()]}),g.jsx("span",{className:"font-bold",children:"Result"}),g.jsxs("span",{className:l,children:[g.jsxs("span",{className:"text-gray-600",children:[": ",s]})," ( ",(b=e==null?void 0:e.RESULTS)==null?void 0:b.trim()," )"]})]})}),g.jsx("div",{children:g.jsx("div",{className:"overflow-hidden",children:g.jsxs("table",{className:"w-full border-collapse",children:[g.jsx("thead",{children:g.jsxs("tr",{className:"bg-gray-100",children:[g.jsx("th",{className:"p-2 border-t border-b border-gray-200 text-left",children:"SUBJECT"}),g.jsx("th",{className:"p-2 border-t border-b border-gray-200 text-center w-20",children:"Marks"}),g.jsx("th",{className:"p-2 border-t border-b border-gray-200 text-center w-20",children:"Grade"}),g.jsx("th",{className:"p-2 border-t border-b border-gray-200 text-center w-20",children:"Result"})]})}),g.jsx("tbody",{children:i.map((y,u)=>{var E;const S=y.result&&y.result.toUpperCase()==="F"?"text-red-600":"text-gray-800",R=((E=y.result)==null?void 0:E.toUpperCase())==="P"?"text-green-600 font-bold":"text-red-600 font-bold";return g.jsxs("tr",{className:u%2===0?"":"bg-gray-50",children:[g.jsx("td",{style:{fontSize:14},className:"p-1 border-b border-gray-200 uppercase",children:y==null?void 0:y.name}),g.jsx("td",{className:`p-1 border-b border-gray-200 text-center ${S} font-medium`,children:y==null?void 0:y.marks}),g.jsx("td",{className:`p-1 border-b border-gray-200 text-center ${R}`,children:(y==null?void 0:y.grade)||"-"}),g.jsx("td",{className:`p-1 border-b border-gray-200 text-center ${R}`,children:(y==null?void 0:y.result)||"-"})]},u)})})]})})})]})}export{Wt as T};
