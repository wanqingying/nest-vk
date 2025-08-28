-- 创建测试表，包含JSONB字段

CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    profile JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建产品表，用于测试复杂的JSONB操作
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    details JSONB NOT NULL,
    tags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试数据
INSERT INTO user_profiles (name, profile, metadata) VALUES 
('张三', 
 '{"age": 25, "city": "北京", "interests": ["编程", "音乐", "旅行"], "contact": {"email": "zhangsan@example.com", "phone": "13800138000"}}',
 '{"source": "web", "last_login": "2024-01-15T10:30:00Z"}'),
('李四', 
 '{"age": 30, "city": "上海", "interests": ["摄影", "读书"], "contact": {"email": "lisi@example.com"}, "premium": true}',
 '{"source": "mobile", "last_login": "2024-01-14T15:45:00Z"}'),
('王五', 
 '{"age": 22, "city": "深圳", "interests": ["游戏", "运动", "电影"], "contact": {"phone": "13900139000"}, "settings": {"theme": "dark", "notifications": true}}',
 '{"source": "api", "registration_date": "2023-12-01"}');

INSERT INTO products (name, details, tags) VALUES
('智能手机', 
 '{"brand": "Apple", "model": "iPhone 15", "specs": {"storage": "256GB", "color": "蓝色", "price": 7999}, "features": ["Face ID", "无线充电", "防水"]}',
 '["手机", "苹果", "智能设备"]'),
('笔记本电脑', 
 '{"brand": "Dell", "model": "XPS 13", "specs": {"ram": "16GB", "storage": "512GB SSD", "cpu": "Intel i7", "price": 12999}, "warranty": {"years": 2, "type": "全球联保"}}',
 '["电脑", "笔记本", "办公"]');

-- JSONB基础查询操作
-- 1. 查询JSON字段中的特定值
SELECT name, profile->>'age' as age, profile->>'city' as city 
FROM user_profiles;

-- 2. 查询嵌套JSON对象
SELECT name, profile->'contact'->>'email' as email 
FROM user_profiles 
WHERE profile->'contact' ? 'email';

-- 3. 查询JSON数组
SELECT name, profile->'interests' as interests 
FROM user_profiles;

-- 4. 使用JSON路径查询
SELECT name, profile #> '{contact,email}' as email 
FROM user_profiles;

-- JSONB条件查询
-- 5. 查询包含特定键的记录
SELECT * FROM user_profiles WHERE profile ? 'premium';

-- 6. 查询JSON字段值匹配的记录
SELECT * FROM user_profiles WHERE profile->>'city' = '北京';

-- 7. 查询数组包含特定元素
SELECT * FROM user_profiles WHERE profile->'interests' ? '编程';

-- 8. 查询数字范围
SELECT * FROM user_profiles WHERE (profile->>'age')::int BETWEEN 20 AND 28;

-- JSONB更新操作
-- 9. 更新JSON字段中的特定值
UPDATE user_profiles 
SET profile = jsonb_set(profile, '{age}', '26') 
WHERE name = '张三';

-- 10. 添加新的JSON字段
UPDATE user_profiles 
SET profile = profile || '{"vip_level": "gold"}'::jsonb 
WHERE name = '李四';

-- 11. 删除JSON字段
UPDATE user_profiles 
SET profile = profile - 'premium' 
WHERE name = '李四';

-- 12. 更新嵌套对象
UPDATE user_profiles 
SET profile = jsonb_set(profile, '{contact,phone}', '"13700137000"') 
WHERE name = '张三';

-- 13. 向数组添加元素
UPDATE user_profiles 
SET profile = jsonb_set(profile, '{interests}', (profile->'interests') || '"美食"'::jsonb) 
WHERE name = '王五';

-- JSONB聚合查询
-- 14. 统计不同城市的用户数
SELECT profile->>'city' as city, COUNT(*) as user_count 
FROM user_profiles 
GROUP BY profile->>'city';

-- 15. 计算平均年龄
SELECT AVG((profile->>'age')::int) as avg_age 
FROM user_profiles;

-- JSONB索引操作
-- 16. 创建GIN索引以加速JSONB查询
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile ON user_profiles USING GIN (profile);
CREATE INDEX IF NOT EXISTS idx_products_details ON products USING GIN (details);

-- 17. 创建表达式索引
CREATE INDEX IF NOT EXISTS idx_user_city ON user_profiles ((profile->>'city'));
CREATE INDEX IF NOT EXISTS idx_user_age ON user_profiles (((profile->>'age')::int));

-- 高级JSONB操作
-- 18. 使用jsonb_path_query进行复杂查询
SELECT name, jsonb_path_query(profile, '$.interests[*]') as interest 
FROM user_profiles;

-- 19. 合并多个JSONB对象
SELECT name, profile || metadata as combined_data 
FROM user_profiles;

-- 20. 提取所有键
SELECT name, jsonb_object_keys(profile) as profile_keys 
FROM user_profiles;

-- 21. 检查JSON结构
SELECT name, jsonb_typeof(profile->'interests') as interests_type 
FROM user_profiles;

-- 22. 递归查询嵌套结构
WITH RECURSIVE json_tree AS (
    SELECT name, jsonb_each(profile) as kv, 1 as level
    FROM user_profiles
    UNION ALL
    SELECT jt.name, jsonb_each((jt.kv).value), jt.level + 1
    FROM json_tree jt
    WHERE jsonb_typeof((jt.kv).value) = 'object' AND jt.level < 3
)
SELECT name, (kv).key, (kv).value, level 
FROM json_tree 
ORDER BY name, level;

-- 性能测试查询
-- 23. 使用EXPLAIN ANALYZE分析查询性能
EXPLAIN ANALYZE 
SELECT * FROM user_profiles 
WHERE profile @> '{"city": "北京"}';

-- 24. 比较操作符性能
EXPLAIN ANALYZE 
SELECT * FROM user_profiles 
WHERE profile->>'city' = '北京';

-- 清理数据（可选）
-- DROP TABLE IF EXISTS user_profiles;
-- DROP TABLE IF EXISTS products;
