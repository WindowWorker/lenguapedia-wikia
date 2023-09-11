import { fileFromRequest } from './static-files.mjs';
import { normalizeRequest, mapResDTO, applyResponse } from './modules/http-fetch.mjs';
import { addCorsHeaders } from './modules/cors-headers.mjs';
import fetch from 'node-fetch';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
let hostTarget = 'starwars.fandom.com';
let hostList = [];
hostList.push(hostTarget);


  
let apiHostList = ['api.lenguapedia.org' ,  'lenguapedia-api.vercel.app' ,'lenguapedia-api.weblet.repl.co'];
let apiHost = undefined;

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



  resDTO = mapResDTO(resDTO, response);



resDTO.headers['Cloudflare-CDN-Cache-Control'] = 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    resDTO.headers['Vercel-CDN-Cache-Control'] = 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    resDTO.headers['CDN-Cache-Control']= 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    resDTO.headers['Cache-Control']= 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    resDTO.headers['Surrogate-Control']='public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';

if(ct){
  resDTO.headers['content-type'] = ct.replace('UTF-8','utf-8');
}
  if(ct===null){
    resDTO.headers['content-type'] = 'text/html; charset=utf-8';
  }
 
delete(resDTO.headers['X-Content-Type-Options']);
  delete(resDTO.headers['x-content-type-options']);
  delete(resDTO.headers['content-security-policy']);
  delete(resDTO.headers['content-security-policy-report-only']);

  
  if ((ct) && (!ct.includes('image')) && (!ct.includes('video')) && (!ct.includes('audio'))) {

    /* Copy over target response and return */
    let resBody = await response.text();
    if (ct.includes('html') || ct.includes('xml') || pat.endsWith('.html') || pat.endsWith('.xhtml')) {
     // resDTO.headers['Content-Language']='en';
      if(determineApiHost.unawaited){
        determineApiHost = await determineApiHost;
      }
      resBody = resBody.replace('nosniff','').replace('<head>',
        `<head>` +
        `<script src="/sw.js?`+new Date().getTime()+`"></script>`+
        `<script src="https://files-servleteer.vercel.app/fandom/link-resolver.js" host-list=` + btoa(JSON.stringify(hostList)) + `></script>` +
        `<script src="https://files-servleteer.vercel.app/link-resolver-full.js"` + new Date().getTime() + `></script>` +
        `<script src="https://files-servleteer.vercel.app/fandom/fandom-block.js"></script>` +
        `<link rel="stylesheet" href="https://files-servleteer.vercel.app/fandom/fandom-block.css"></link>`+
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
        `<script defer src="https://files-servleteer.vercel.app/fandom/link-resolver.js" host-list=` + btoa(JSON.stringify(hostList)) + `></script>
        <script src="https://files-servleteer.vercel.app/fandom/decode-fix.js" defer></script>
        </body>`);
    }
    /*   if (ct.includes('script')) {
     resBody = resBody.replaceAll(hostTarget,hostProxy);
    
   }*/
  
    resDTO.body = resBody;
      if(pat=='/asdf.html'){resDTO.body=`<!DOCTYPE html>
<html lang="uk">
<body>

<h1>The script element</h1>

<p id="demo"></p>
Ð<br><b>ÐŸ</b>
Падме Амідала

<script>


function uncode(str) {
    const encoder = new TextEncoder();
    const view = encoder.encode(str);
    let wrong = String.fromCharCode(...view);
	let test = wrong.split('');
	test[1]=test[1].replace('\\x','');
	console.log(wrong);
	let wronger=wrong.split('').map(x=>x.replace('\\x',''));
	console.log(wronger);
	document.getElementById("demo").textContent=wrong+'<br>'+'<b>ÐŸ</b>';
	return wronger;
  }
uncode('П');

</script> 

</body>
</html>
`;resDTO.headers['content-type']='text/html; charset=utf-8';
                           }
    return resDTO;


  } else {

    let resBody = Buffer.from(await response.arrayBuffer());
    resDTO.body = resBody;
    return resDTO;

  }

//}catch(e){console.log(e.message);}

}