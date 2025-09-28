// patch_common_plugin.js
// 用途：将 /dreame-product/public/common-plugin 接口返回的 data.url 与 data.md5 替换为自定义值
// 在 Quantumult X 中使用：
// ^https?:\/\/[^\/]+\/dreame-product\/public\/common-plugin(\/|\?|$) url script-response-body https://raw.githubusercontent.com/<user>/<repo>/main/patch_common_plugin.js

(function () {
  'use strict';

  try {
    // QX 提供的响应对象
    const body = typeof $response !== 'undefined' && $response.body;
    if (!body) {
      // 没有响应体时原样结束（避免阻断请求）
      $done({});
      return;
    }

    let json;
    try {
      json = JSON.parse(body);
    } catch (err) {
      // 解析失败，直接返回原始响应（并在控制台记录错误）
      console.log('patch_common_plugin.js — JSON parse error:', err);
      $done({});
      return;
    }

    // 只在存在 data 字段时修改，保护性检查
    if (json && typeof json === 'object' && json.data && typeof json.data === 'object') {
      // --- 在这里修改为你希望注入的 URL 和 MD5 ---
      json.data.url = 'https://raw.githubusercontent.com/shuntou/DREAME.Bottom/main/f3c3ed6090bbd787576ac97ef028cbe0___UNI__EDB922E.zip';
      json.data.md5 = 'ffcba5b0072acb1f1c53aba76bb22100';
      // ------------------------------------------------
    } else {
      console.log('patch_common_plugin.js — response JSON has no .data field, skipping modification.');
      $done({ body: JSON.stringify(json) });
      return;
    }

    // 返回修改后的响应
    $done({ body: JSON.stringify(json) });
  } catch (e) {
    // 万一出错，记录并放行原始响应，避免影响 App 使用
    console.log('patch_common_plugin.js — unexpected error:', e);
    $done({});
  }
})();
