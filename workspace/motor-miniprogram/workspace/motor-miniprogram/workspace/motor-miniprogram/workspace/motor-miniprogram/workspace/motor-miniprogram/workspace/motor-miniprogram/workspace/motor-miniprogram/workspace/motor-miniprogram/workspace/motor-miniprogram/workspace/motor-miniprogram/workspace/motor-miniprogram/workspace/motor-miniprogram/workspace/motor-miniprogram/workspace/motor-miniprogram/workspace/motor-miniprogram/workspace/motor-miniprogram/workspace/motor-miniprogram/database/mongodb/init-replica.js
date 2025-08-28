// MongoDB 副本集初始化脚本
rs.initiate({
  _id: 'rs0',
  version: 1,
  members: [
    {
      _id: 0,
      host: 'mongo-primary:27017',
      priority: 10
    },
    {
      _id: 1,
      host: 'mongo-secondary1:27017',
      priority: 5
    },
    {
      _id: 2,
      host: 'mongo-secondary2:27017',
      priority: 1
    }
  ]
});

// 等待副本集初始化完成
while (!rs.isMaster().ismaster) {
  sleep(1000);
}

// 创建应用数据库
use('motor');

// 创建用户管理员
db.createUser({
  user: 'motor_admin',
  pwd: 'motor_admin_password_change_in_production',
  roles: [
    { role: 'dbAdmin', db: 'motor' },
    { role: 'readWrite', db: 'motor' }
  ]
});

// 创建应用用户
db.createUser({
  user: 'motor_app',
  pwd: 'motor_app_password_change_in_production',
  roles: [
    { role: 'readWrite', db: 'motor' }
  ]
});

// 创建基础集合和索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

db.motorcycles.createIndex({ make: 1, model: 1, year: 1 });
db.motorcycles.createIndex({ category: 1 });
db.motorcycles.createIndex({ createdAt: -1 });
db.motorcycles.createIndex({ updatedAt: -1 });

db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 * 30 }); // 30天过期

// 创建初始管理员用户
db.users.insertOne({
  _id: ObjectId(),
  username: 'admin',
  email: 'admin@motor-projects.com',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.BPWQ0vOWS', // 默认密码: admin123
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB replica set initialized successfully');