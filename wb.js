// 微博去广告重写脚本 for Quantumult X
// 版本: 1.0.0

function rewriteWeiboResponse(response) {
    try {
        // 解析JSON响应
        let jsonData = JSON.parse(response.body);
        
        // 处理首页信息流广告
        if (jsonData.statuses) {
            jsonData.statuses = jsonData.statuses.filter(item => {
                // 过滤掉广告标识的内容
                if (item.mblogtype === 2 || item.advertisement === 1) {
                    return false;
                }
                // 过滤掉推广内容
                if (item.promotion && item.promotion.type === 1) {
                    return false;
                }
                // 过滤掉带有广告关键词的内容
                if (item.text && (item.text.includes("广告") || item.text.includes("推广"))) {
                    return false;
                }
                return true;
            });
        }
        
        // 处理热门话题中的广告
        if (jsonData.data && jsonData.data.cards) {
            jsonData.data.cards = jsonData.data.cards.filter(card => {
                // 过滤广告卡片
                if (card.card_type === 9 || card.is_ad === 1) {
                    return false;
                }
                // 过滤包含广告内容的卡片
                if (card.mblog && (card.mblog.mblogtype === 2 || card.mblog.advertisement === 1)) {
                    return false;
                }
                return true;
            });
        }
        
        // 处理推荐关注中的广告
        if (jsonData.data && jsonData.data.users) {
            jsonData.data.users = jsonData.data.users.filter(user => {
                return !(user.is_ad === 1 || user.is_promotion === 1);
            });
        }
        
        // 将处理后的JSON转换回字符串
        response.body = JSON.stringify(jsonData);
    } catch (e) {
        console.log("微博去广告脚本错误: " + e);
    }
    return response;
}

// 应用重写规则
let urls = [
    "https://api.weibo.cn/2/statuses/home_timeline",
    "https://api.weibo.cn/2/statuses/friends_timeline",
    "https://api.weibo.cn/2/feed/trends",
    "https://api.weibo.cn/2/cardlist",
    "https://api.weibo.cn/2/recommend/users"
];

// 对匹配的URL应用重写
if (urls.some(url => $request.url.includes(url))) {
    $done(rewriteWeiboResponse($response));
} else {
    $done($response);
}
