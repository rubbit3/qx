// patch_common_plugin.js (with debug logs, keep original md5 if exists)
// 用法（QX rewrite_local）:
// ^https?:\/\/[^\/]+\/dreame-product\/public\/common-plugin(\/|\?|$) url script-response-body https://raw.githubusercontent.com/<user>/<repo>/main/patch_common_plugin.js

(function () {
  'use strict';

  function now() { return new Date().toISOString(); }

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

    // 读取原始 data.url 与 data.md5（若存在）
    const origUrl = json && json.data && json.data.url ? json.data.url : null;
    const origMd5 = json && json.data && json.data.md5 ? json.data.md5 : null;
    console.log(`[patch_common_plugin] ${now()} - original data.url: ${origUrl}`);
    console.log(`[patch_common_plugin] ${now()} - original data.md5: ${origMd5}`);

    // 在这里设置你想注入的 URL；md5 将优先保留原始响应的值
    const newUrl = 'https://raw.githubusercontent.com/shuntou/DREAME.Bottom/main/f3c3ed6090bbd787576ac97ef028cbe0___UNI__EDB922E.zip';
    const fallbackNewMd5 = 'ffcba5b0072acb1f1c53aba76bb22100'; // 如果原始 md5 不存在就使用这个（可按需改）

    if (json && typeof json === 'object' && json.data && typeof json.data === 'object') {
      // 替换 URL
      json.data.url = newUrl;
      // 将原始 md5 赋回；若原始 md5 不存在，则使用 fallbackNewMd5
      json.data.md5 = origMd5 ;

      console.log(`[patch_common_plugin] ${now()} - replaced data.url -> ${json.data.url}`);
      console.log(`[patch_common_plugin] ${now()} - set data.md5 -> ${json.data.md5} (orig: ${origMd5})`);
    } else {
      console.log(`[patch_common_plugin] ${now()} - response JSON has no .data field, skip modification.`);
      $done({ body: JSON.stringify(json) });
      return;
    }

    // 返回修改后的响应
    $done({ body: JSON.stringify(json) });
  } catch (e) {
    console.log(`[patch_common_plugin] ${now()} - unexpected error: ${e}`);
    $done({});
  }
})();
