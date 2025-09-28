// patch_common_plugin.js (with debug logs)
// 用法（QX rewrite_local）:
// ^https?:\/\/[^\/]+\/dreame-product\/public\/common-plugin(\/|\?|$) url script-response-body https://raw.githubusercontent.com/<user>/<repo>/main/patch_common_plugin.js

(function () {
  'use strict';

  function now() {
    return new Date().toISOString();
  }

  try {
    const reqUrl = (typeof $request !== 'undefined' && $request.url) ? $request.url : 'unknown-request-url';
    const body = (typeof $response !== 'undefined' && $response.body) ? $response.body : null;

    console.log(`[patch_common_plugin] ${now()} - script start. requestUrl: ${reqUrl}`);

    if (!body) {
      console.log(`[patch_common_plugin] ${now()} - empty response body, nothing to do.`);
      $done({});
      return;
    }

    let json;
    try {
      json = JSON.parse(body);
    } catch (err) {
      console.log(`[patch_common_plugin] ${now()} - JSON parse error: ${err}. Returning original body.`);
      $done({});
      return;
    }

    // 打印原始 data 字段（若存在）
    const origUrl = json && json.data && json.data.url ? json.data.url : null;
    const origMd5 = json && json.data && json.data.md5 ? json.data.md5 : null;
    console.log(`[patch_common_plugin] ${now()} - original data.url: ${origUrl}`);
    console.log(`[patch_common_plugin] ${now()} - original data.md5: ${origMd5}`);

    // 仅在存在 data 字段时修改，增加保护性检查
    if (json && typeof json === 'object' && json.data && typeof json.data === 'object') {
      // ======= 在这里修改为你希望注入的 URL 与 MD5 =======
      const newUrl = 'https://raw.githubusercontent.com/shuntou/DREAME.Bottom/main/f3c3ed6090bbd787576ac97ef028cbe0___UNI__EDB922E.zip';
      const newMd5 = 'ffcba5b0072acb1f1c53aba76bb22100';
      // ====================================================
      json.data.url = newUrl;
      json.data.md5 = newMd5;

      console.log(`[patch_common_plugin] ${now()} - replaced data.url -> ${newUrl}`);
      console.log(`[patch_common_plugin] ${now()} - replaced data.md5 -> ${newMd5}`);
    } else {
      console.log(`[patch_common_plugin] ${now()} - response JSON has no .data field, skip modification.`);
      $done({ body: JSON.stringify(json) });
      return;
    }

    // 可选：如果你想同时在日志中打印整个修改后的 data 对象（慎用，可能很长）
    // console.log(`[patch_common_plugin] ${now()} - new data object: ${JSON.stringify(json.data)}`);

    $done({ body: JSON.stringify(json) });
  } catch (e) {
    console.log(`[patch_common_plugin] ${now()} - unexpected error: ${e}`);
    $done({});
  }
})();
