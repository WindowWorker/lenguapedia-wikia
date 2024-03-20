import { fileFromRequest } from './static-files.mjs';
import { normalizeRequest, mapResDTO, applyResponse } from './modules/http-fetch.mjs';
import { addCorsHeaders } from './modules/cors-headers.mjs';
//import fetch from 'node-fetch';

let preloadCSSImport = import('./modules/preload-css.js');
preloadCSSImport.unawaited = true;

async function fetchText(url){
  let res = await fetch(url);
  return res.text();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
let after='';//new Date().getTime();
let hostTarget = 'starwars.fandom.com';
let hostList = [];
hostList.push(hostTarget);


  
let apiHostList = ['api.lenguapedia.org' ,  'lenguapedia-api.vercel.app' ,'lenguapedia-api.weblet.repl.co'];
let apiHost = undefined;
//let chars = fetchText('https://files-servleteer-vercel-app-six.vercel.app/fandom/chars.html');
//chars.unawaited = true;
let determineApiHost=(async function(){
for(let i=0;i<apiHostList.length;i++){try{

let apiResponse = await fetch('https://'+apiHostList[i]+'/jsonp/https://en.wikipedia.org');
if(apiResponse.status==200){apiHost = apiHostList[i];break;}
  
}catch(e){console.log(e);continue;}}

if(!apiHost){apiHost='lenguapedia-api.vercel.app';}
  return {unawaited:false};
})();

determineApiHost.unawaited = true;

export async function serverRequestResponse(reqDTO) {//try{
  if (reqDTO.headers['wikia']) {
    hostTarget = reqDTO.headers['wikia'];
    hostTarget=hostTarget
      .replace('wika.lenguapedia.org','wikia.lenguapedia.org')
      .replace('.wikia.lenguapedia.org','.fandom.com')
      .replace('_wikia.lenguapedia.org','.fandom.com')
      .replace('-wikia.lenguapedia.org','.fandom.com');
    hostList.push(hostTarget);
  }else if(reqDTO.shortURL.includes('wikia=')){
    hostTarget=reqDTO.shortURL.split('wikia=')[1].split('?')[0].split('#')[0];
  }
  let referer = reqDTO.headers['referer'];
  
  let resDTO = {};
  resDTO.headers = {};
  let hostProxy = reqDTO.host;
  hostList.push(hostProxy);
  //console.log(hostProxy);
  let path = reqDTO.shortURL.replaceAll('*', '');
  if(path.startsWith('/_root/')){path=path.replace('/_root/','/');}
  else if(path.startsWith('/_root')){path=path.replace('/_root','/');}
  let pat = path.split('?')[0].split('#')[0];

  if (reqDTO.shortURL == '/ping') {
    resDTO.statusCode = 200;
    return resDTO;
  }
  if ((pat == '/link-resolver.js') || (pat == '/fandom-block.js')) {

    return fileFromRequest('/public/js/' + pat);

  }
  if (pat == '/fandom-block.css') {

    return fileFromRequest('/public/css/' + pat);

  }
if(pat=='/sw.js'){
let swResponse = await fetch('https://filers.lenguapedia.org/sw.js');
  resDTO.body = await swResponse.text();
  resDTO.headers['content-type'] ='text/javascript; charset=utf-8';
  resDTO.headers['x-content-type']=resDTO.headers['content-type'];
  return resDTO;
}

  



  
    
  

  reqDTO.host = hostTarget;
  reqDTO.headers.host = hostTarget;
  reqDTO.headers.referer = hostTarget;

  /* fetch from your desired target */
  let response;
  let ct;

  let backoff = 1;
  let paramChar = path.includes('?') ? '&' : '?';
  let salt = paramChar + 'á';
  let tryDTO = reqDTO;

  for (let i = 0; i < 5; i++) {
    backoff *= 2;
    await sleep(backoff);
    try {
      if (i == 3) { tryDTO = undefined; }
      response = await fetch('https://' + hostTarget + path + salt, tryDTO);
      salt = paramChar + new Date().getTime();
      ct = response.headers.get('content-type');

      if ((ct !== undefined) && (ct === null)) {
      //  console.log('retry: ' + path + salt);

      } else {
        break;
      }

    } catch (e) {
      salt = '?' + new Date().getTime();
      // console.log(e.message);
      continue;
    }
  }

  if (response.headers.get('location')) {
    response = await fetch(response.headers.get('location'));
  }

//console.log(response);

  resDTO = mapResDTO(resDTO, response);



resDTO.headers['Cloudflare-CDN-Cache-Control'] = 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    resDTO.headers['Vercel-CDN-Cache-Control'] = 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    resDTO.headers['CDN-Cache-Control']= 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    resDTO.headers['Cache-Control']= 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    resDTO.headers['Surrogate-Control']='public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';

  let charset='utf-8';
if(ct){
  resDTO.headers['content-type'] = ct.toLowerCase().replace('utf-8',charset);
  resDTO.headers['x-content-type']=resDTO.headers['content-type'];
}
  if(ct===null){
    resDTO.headers['content-type'] = 'text/html; charset='+charset;
    resDTO.headers['x-content-type']=resDTO.headers['content-type'];
  }
 
delete(resDTO.headers['X-Content-Type-Options']);
  delete(resDTO.headers['x-content-type-options']);
  delete(resDTO.headers['content-security-policy']);
  delete(resDTO.headers['content-security-policy-report-only']);
  
//console.log(resDTO.headers);
  if ((ct) && (!ct.includes('image')) && (!ct.includes('video')) && (!ct.includes('audio'))) {

    /* Copy over target response and return */
    let charsetDecoder = '';
      try{
       charsetDecoder = new TextDecoder(charset);
      }catch(e){
        console.log('charset error for '+charset);
       charsetDecoder = new TextDecoder();
      }
      /* Copy over target response and return */
      let resBuffer = await response.arrayBuffer();
      let resBody = charsetDecoder.decode(resBuffer);
    resBody.replace(/charset="[^"]*"/gi,'charset="'+charset+'"');
    if (ct.includes('html') || ct.includes('xml') || pat.endsWith('.html') || pat.endsWith('.xhtml')) {
     // resDTO.headers['Content-Language']='en';
      if(determineApiHost.unawaited){
        determineApiHost = await determineApiHost;
      }
      if(preloadCSSImport.unawaited){
        preloadCSSImport = await preloadCSSImport;
      }
    //  if(chars.unawaited){
    //    chars = await chars;
    //  }
      resBody = resBody.replace('nosniff','').replaceAll('class="thumbimage lazyload"','class="thumbimage"').replace('<head>',
        `<head>` +
        preloadCSS +
         `<link href="https://api.lenguapedia.org/corsFetchStyles/https://`+hostTarget+`/wikia.php?controller=ThemeApi&method=themeVariables" rel="stylesheet">`    +
        `<link rel="stylesheet" href="https://api.lenguapedia.org/corsFetchStyles/https://`+hostTarget+`/load.php?lang=en&modules=site.styles&only=styles&skin=fandomdesktop">`+
        `<script src="/sw.js?`+after+`"></script>`+
      //  `<script src="https://files-servleteer-vercel-app-six.vercel.app/fandom/link-resolver.js" host-list=` + btoa(JSON.stringify(hostList)) + `></script>` +
       // `<script src="https://files-servleteer-vercel-app-six.vercel.app/link-resolver-full.js"` + new Date().getTime() + `></script>` +
        `<script src="https://files-servleteer-vercel-app-six.vercel.app/fandom/fandom-block.js"></script>` +
        `<link rel="stylesheet" href="https://files-servleteer-vercel-app-six.vercel.app/fandom/fandom-block.css"></link>`+
        `<http>
          <http-response>
            <http-headers>
              <http-header key="referer" value="`+referer+`"></http-header>
            </http-headers>
          </http-response>
        </http>`)
        .replaceAll('https://static.wikia.nocookie.net', 'https://'+apiHost+'/corsFetch/https:/static.wikia.nocookie.net')
        .replace(/src="https:\/\/services.fandom[^"]*"/gi,'type="dev/null"')
        .replace('</body>',
        `<script defer src="https://files-servleteer-vercel-app-six.vercel.app/fandom/link-resolver.js" host-list=` + btoa(JSON.stringify(hostList)) + `></script>`+
       // `<script src="https://files-servleteer-vercel-app-six.vercel.app/fandom/decode-fix.js" defer></script>` +
       // chars +
        `</body>`);
    }
    /*   if (ct.includes('script')) {
     resBody = resBody.replaceAll(hostTarget,hostProxy);
    
   }*/
  
    resDTO.body = resBody;
      
    return resDTO;


  } else {

     let resBody ;
      if(response.fullBody){
         resBody = Buffer.from(response.fullBody);
      }else{
     resBody = Buffer.from(await(response).arrayBuffer());
      }
    resDTO.body = resBody;
    return resDTO;

  }

//}catch(e){console.log(e.message);}

}

