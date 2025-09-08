/*
  weibo_clean_all.js
  作用：拦截并净化 Weibo 几类接口的响应：
    - 个人主页 /2/profile/me?  (隐藏 我的钱包 / 超话 等)
    - 热搜 page/flowpage
    - 首页 timeline (friends timeline)
    - 发现页 search / finder / container_discover
    - 评论区 / 转发区
  同时打印详细日志到 Quantumult X 的脚本日志（console.log）
  使用方法：在 Quantumult X 的 rewrite_local 中用 script-response-body 引用该 raw URL
*/

(() => {
  const url = $request.url || '';
  console.log('[weibo_clean] hit url -> ' + url);

  const body = $response && $response.body;
  if (!body) {
    console.log('[weibo_clean] no response body, skip');
    $done({});
    return;
  }

  let obj;
  try {
    obj = JSON.parse(body);
  } catch (e) {
    console.log('[weibo_clean] parse JSON error: ' + e);
    $done({ body }); // 返回原始响应以免破坏页面
    return;
  }

  let removedDetails = [];

  // ===== 个人主页处理 (/2/profile/me?) =====
  if (/\/2\/profile\/me\?/.test(url)) {
    console.log('[weibo_clean][profile] processing profile/me');

    // 删除整卡（整块卡片）
    const removeItemIds = ['100505_-_mypay_new', '100505_-_chaohua', '100505_-_mypay', '100505_-_my_pay'];
    if (Array.isArray(obj.items)) {
      const before = obj.items.length;
      obj.items = obj.items.filter(it => {
        if (it && it.itemId && removeItemIds.includes(it.itemId)) {
          removedDetails.push({type: 'profile_item', id: it.itemId});
          return false;
        }
        return true;
      });
      console.log(`[weibo_clean][profile] items ${before} -> ${obj.items.length}`);
    }

    // top8 小图标区域，删除 pay 小图标（itemId: 100505_-_pay）
    try {
      const top8 = Array.isArray(obj.items) ? obj.items.find(it => it.itemId === '100505_-_top8') : null;
      if (top8 && Array.isArray(top8.items)) {
        const before = top8.items.length;
        top8.items = top8.items.filter(sub => {
          if (sub && sub.itemId === '100505_-_pay') {
            removedDetails.push({type: 'top8_icon', id: sub.itemId});
            return false;
          }
          return true;
        });
        console.log(`[weibo_clean][profile] top8 ${before} -> ${top8.items.length}`);
      }
    } catch (e) {
      console.log('[weibo_clean][profile] top8 handling error: ' + e);
    }
  }

  // ===== 通用广告/推广清理（timeline / page / flowpage / search / comments / forward） =====
  const adTargetPattern = /\/2\/(page|flowpage)\?|\/2\/statuses\/(unread_)?friends|\/2\/search\/(finder|container_timeline|container_discover)\?|\/2\/comments\/mix_comments\?|\/2\/statuses\/container_detail_forward\?|weibointl\.api\.weibo\.cn/;
  if (adTargetPattern.test(url)) {
    console.log('[weibo_clean][ads] processing ads for url pattern');

    const isAdObject = (o) => {
      if (!o || typeof o !== 'object') return false;
      if (o.is_ad || o.ad_state || o.ad || o.adid) return true;
      if (o.promotion) return true;
      // nested mblog
      if (o.mblog && (o.mblog.is_ad || o.mblog.ad_state || o.mblog.promotion)) return true;
      const typename = (o.mblogtypename || o.mblog?.mblogtypename || '') + '';
      if (/广告|推广|promote|promotion|ad/i.test(typename)) return true;
      return false;
    };

    const filterArr = (arr, path) => {
      if (!Array.isArray(arr)) return arr;
      const before = arr.length;
      const res = arr.filter(it => !isAdObject(it));
      const after = res.length;
      if (before !== after) {
        console.log(`[weibo_clean][ads] filtered ${path} ${before} -> ${after} removed=${before-after}`);
        removedDetails.push({type: 'ads_array', path, removed: before - after});
      }
      return res;
    };

    // 尽量精准处理常见字段
    try {
      if (Array.isArray(obj.cards)) obj.cards = filterArr(obj.cards, 'cards');
      if (Array.isArray(obj.items)) obj.items = filterArr(obj.items, 'items');
      if (Array.isArray(obj.statuses)) obj.statuses = filterArr(obj.statuses, 'statuses');

      // 处理嵌套的 card_group / cards
      if (Array.isArray(obj.cards)) {
        obj.cards = obj.cards.map(c => {
          if (c && Array.isArray(c.card_group)) c.card_group = filterArr(c.card_group, 'card_group');
          if (c && Array.isArray(c.cards)) c.cards = filterArr(c.cards, 'cards_in_card');
          return c;
        });
      }

      // 尝试删除一些通用容器字段，减少残留
      ['ad', 'ads', 'advertises', 'open_ad_list', 'open_ad', 'openAdList'].forEach(k => {
        if (obj.hasOwnProperty(k)) {
          delete obj[k];
          console.log(`[weibo_clean][ads] deleted container ${k}`);
          removedDetails.push({type: 'deleted_container', key: k});
        }
      });

      // 深度递归清理（谨慎）：把识别为整段广告的对象移除
      const deepClean = (x, path = '') => {
        if (Array.isArray(x)) {
          return x.map((v, idx) => deepClean(v, path + `[${idx}]`)).filter(v => v !== null);
        } else if (x && typeof x === 'object') {
          if (isAdObject(x)) {
            // 整个对象被视作广告 -> 删除
            removedDetails.push({type: 'deep_ad_obj', path});
            return null;
          }
          const keys = Object.keys(x);
          for (const k of keys) {
            x[k] = deepClean(x[k], path + '.' + k);
            if (x[k] === null) delete x[k];
          }
          return x;
        }
        return x;
      };

      obj = deepClean(obj) || {};
    } catch (e) {
      console.log('[weibo_clean][ads] cleaning error: ' + e);
    }
  }

  // finalize
  try {
    const newBody = JSON.stringify(obj);
    console.log('[weibo_clean] done. removedDetails=', JSON.stringify(removedDetails));
    $done({ body: newBody });
  } catch (e) {
    console.log('[weibo_clean] stringify error: ' + e);
    $done({ body });
  }
})();
