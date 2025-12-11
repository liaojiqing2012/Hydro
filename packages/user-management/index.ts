import { Context, Handler, Schema, UserModel, PRIV, Types } from 'hydrooj';

// 用户列表Handler
class UserManagementHandler extends Handler {
    async get() {
        // 权限检查
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        
        // 查询用户列表
        const users = await UserModel.getList({}, 0, 20);
        const total = await UserModel.count({});
        
        // 返回响应
        this.response.body = {
            title: '用户管理',
            users,
            total,
            page: 1,
            limit: 20,
            message: '用户管理插件已加载'
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
        
        // 查询用户列表
        const users = await UserModel.getList({}, skip, limit);
        const total = await UserModel.count({});
        
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
        
        // 获取用户ID
        const uid = this.request.params.uid;
        
        // 查询用户详情
        const user = await UserModel.getById(uid);
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