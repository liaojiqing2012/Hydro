import { Context, Service, Handler, Schema, UserModel, PRIV } from 'hydrooj';

// 极简版本的用户管理插件，确保能正常加载
export default class UserManagementService extends Service {
    // 只保留最基本的依赖
    static inject = ['server'];
    static Config = Schema.object({
        enabled: Schema.boolean().default(true),
        adminOnly: Schema.boolean().default(true),
    });

    constructor(ctx: Context, config: ReturnType<typeof UserManagementService.Config>) {
        super(ctx, 'user-management');
        if (!config.enabled) return;

        // 只注册核心路由，不注册菜单
        this.registerRoutes(ctx);
    }

    private registerRoutes(ctx: Context) {
        // 用户列表页面 - 使用最基本的路由注册方式
        ctx.server.get('/manage/users', async (ctx: Handler) => {
            // 简单的权限检查
            if (!ctx.user || !ctx.user.hasPrivilege(PRIV.PRIV_EDIT_SYSTEM)) {
                ctx.response.status = 403;
                ctx.response.body = { error: 'Permission denied' };
                return;
            }

            // 基本的用户列表查询
            const users = await UserModel.getList({}, 0, 20);
            const total = await UserModel.count({});

            // 返回简单的JSON响应
            ctx.response.body = {
                title: '用户管理',
                users,
                total,
                page: 1,
                limit: 20,
                message: '用户管理插件已加载，功能正在开发中'
            };
        });

        // 简单的API路由，返回用户列表
        ctx.server.get('/api/manage/users', async (ctx: Handler) => {
            // 简单的权限检查
            if (!ctx.user || !ctx.user.hasPrivilege(PRIV.PRIV_EDIT_SYSTEM)) {
                ctx.response.status = 403;
                ctx.response.body = { error: 'Permission denied' };
                return;
            }

            // 基本的用户列表查询
            const page = parseInt(ctx.request.query.page || '1');
            const limit = parseInt(ctx.request.query.limit || '20');
            const skip = (page - 1) * limit;

            const users = await UserModel.getList({}, skip, limit);
            const total = await UserModel.count({});

            ctx.response.body = {
                users,
                total,
                page,
                limit
            };
        });
   