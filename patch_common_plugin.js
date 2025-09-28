// patch_common_plugin.js (QX 兼容调试版)
(function () {
  'use strict';

  function now() { return new Date().toISOString(); }

  function log(msg) {
    // QX 中 console.log 不一定显示，改用 $notify
    if (typeof $notify === 'function') {
      $notify('[patch_common_plugin]', now(), msg);
    }
  }

  try {
    const body = $response.body;
    if (!body) {
      log('empty response body, nothing to do.');
      $done({});
      return;
    }

    let json;
    try { json = JSON.parse(body); } 
    catch (err) {
      log('JSON parse error: ' + err);
      $done({});
      return;
    }

    const origUrl = json?.data?.url || null;
    const origMd5 = json?.data?.md5 || null;

    log(`original data.url: ${origUrl}`);
    log(`original data.md5: ${origMd5}`);

    const newUrl = 'https://raw.githubusercontent.com/shuntou/DREAME.Bottom/main/f3c3ed6090bbd787576ac97ef028cbe0___UNI__EDB922E.zip';

    if (json?.data) {
      json.data.url = newUrl;
      json.data.md5 = origMd5; // 保留原始 md5
      log(`replaced data.url -> ${newUrl}`);
      log(`set data.md5 -> ${json.data.md5}`);
    } else {
      log('response JSON has no .data field, skip modification.');
    }

    $done({ body: JSON.stringify(json) });
  } catch (e) {
    log('unexpected error: ' + e);
    $done({});
  }
})();
