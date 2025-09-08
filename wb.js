let body = $response.body;
try {
    let jsonData = JSON.parse(body);
    
    if (jsonData.items && Array.isArray(jsonData.items)) {
        // 直接移除不需要的模块
        jsonData.items = jsonData.items.filter(item => {
            const itemId = item.itemId;
            // 保留这些模块，移除其他金融相关模块
            const keepModules = [
                "profileme_mine",          // 个人资料卡片
                "100505_-_top8",           // 功能入口（会单独处理）
                "100505_-_album",          // 我的相册
                "100505_-_like",           // 赞/收藏
                "100505_-_watchhistory",   // 浏览记录
                "100505_-_draft"           // 草稿箱
            ];
            
            if (keepModules.includes(itemId)) {
                return true;
            }
            
            // 特别处理top8模块，移除金融相关项目
            if (itemId === "100505_-_top8" && item.items) {
                const financialItems = ["100505_-_pay", "100505_-_ordercenter", "100505_-_promote"];
                item.items = item.items.filter(subItem => !financialItems.includes(subItem.itemId));
                return item.items.length > 0; // 如果处理后没有内容了，也移除整个模块
            }
            
            console.log(`移除模块: ${itemId}`);
            return false;
        });
        
        body = JSON.stringify(jsonData);
    }
} catch (error) {
    console.log("处理微博数据时出错: " + error);
}

$done({body});
