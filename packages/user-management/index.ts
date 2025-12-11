import { Context, Handler, Schema, UserModel, PRIV, Types } from 'hydrooj';

// 用户列表Handler
class UserManagementHandler extends Handler {
    async get() {
        // 权限检查
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        
        // 获取domainId
        const domainId = this.request.query.domainId || 'system';
        
        // 查询用户列表
        // 1. 获取所有用户ID
        const cursor = UserModel.getMulti({});
        const udocs = await cursor.toArray();
        const uids = udocs.map(udoc => udoc._id).slice(0, 20);
        
        // 2. 获取用户详细信息
        const userDict = await UserModel.getList(domainId, uids);
        const users = Object.values(userDict);
        
        // 3. 获取总数
        const total = udocs.length;
        
        // 设置模板和数据，让框架自动渲染
        this.response.template = 'user_management.html';
        this.response.body = {
            title: '用户管理',
            users,
            total,
            page: 1,
            limit: 20,
            totalPages: Math.ceil(total / 20),
            keyword: this.request.query.q || '',
            sort: this.request.query.sort || 'uid',
            order: this.request.query.order || 'asc'
        };
    }
}

// API用户列表Handler
class UserManagementApiHandler extends Handler {
    async get() {
        // 权限检查
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        
        // 查询参数
        const page = parseInt(this.request.query.page || '1');
        const limit = parseInt(this.request.query.limit || '20');
        const skip = (page - 1) * limit;
        const domainId = this.request.query.domainId || 'system';
        
        // 查询用户列表
        // 1. 获取所有用户ID
        const cursor = UserModel.getMulti({});
        const udocs = await cursor.toArray();
        const uids = udocs.map(udoc => udoc._id).slice(skip, skip + limit);
        
        // 2. 获取用户详细信息
        const userDict = await UserModel.getList(domainId, uids);
        const users = Object.values(userDict);
        
        // 3. 获取总数
        const total = udocs.length;
        
        // 返回响应
        this.response.body = {
            users,
            total,
            page,
            limit
        };
    }
}

// 用户详情Handler
class UserDetailHandler extends Handler {
    async get() {
        // 权限检查
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        
        // 获取用户ID和domainId
        const uid = parseInt(this.request.params.uid);
        const domainId = this.request.query.domainId || 'system';
        
        // 查询用户详情
        const user = await UserModel.getById(domainId, uid);
        if (!user) {
            this.response.status = 404;
            this.response.body = { error: 'User not found' };
            return;
        }
        
        // 返回响应
        this.response.body = { user };
    }
}

// 插件配置
export const Config = Schema.object({
    enabled: Schema.boolean().default(true),
    adminOnly: Schema.boolean().default(true),
});

// 插件主函数 - 按照官方文档要求，使用apply函数
export async function apply(ctx: Context) {
    // 注册路由 - 使用ctx.Route，而不是ctx.server.get
    ctx.Route('user_management', '/manage/users', UserManagementHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('user_management_api', '/api/manage/users', UserManagementApiHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('user_management_detail', '/manage/users/:uid', UserDetailHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('user_management_api_detail', '/api/manage/users/:uid', UserDetailHandler, PRIV.PRIV_EDIT_SYSTEM);
}