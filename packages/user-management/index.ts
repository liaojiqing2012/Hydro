import { Context, Service, Handler, Schema, UserModel, PRIV } from 'hydrooj';

// 极简版本的用户管理插件，确保能正常加载
export default class UserManagementService extends Service {
    static inject = ['server'];
    static Config = Schema.object({
        enabled: Schema.boolean().default(true),
        adminOnly: Schema.boolean().default(true),
    });

    constructor(ctx: Context, config: ReturnType<typeof UserManagementService.Config>) {
        super(ctx, 'user-management');
        if (!config.enabled) return;

        // 只注册核心路由
        this.registerRoutes(ctx);
    }

    private registerRoutes(ctx: Context) {
        // 用户列表页面
        ctx.server.get('/manage/users', async (ctx: Handler) => {
            // 权限检查
            if (!ctx.user || !ctx.user.hasPrivilege(PRIV.PRIV_EDIT_SYSTEM)) {
                ctx.response.status = 403;
                ctx.response.body = { error: 'Permission denied' };
                return;
            }

            // 查询用户列表
            const users = await UserModel.getList({}, 0, 20);
            const total = await UserModel.count({});

            // 返回响应
            ctx.response.body = {
                title: '用户管理',
                users,
                total,
                page: 1,
                limit: 20,
                message: '用户管理插件已加载'
            };
        });

        // API路由
        ctx.server.get('/api/manage/users', async (ctx: Handler) => {
            // 权限检查
            if (!ctx.user || !ctx.user.hasPrivilege(PRIV.PRIV_EDIT_SYSTEM)) {
                ctx.response.status = 403;
                ctx.response.body = { error: 'Permission denied' };
                return;
            }

            // 查询参数
            const page = parseInt(ctx.request.query.page || '1');
            const limit = parseInt(ctx.request.query.limit || '20');
            const skip = (page - 1) * limit;

            // 查询数据
            const users = await UserModel.getList({}, skip, limit);
            const total = await UserModel.count({});

            // 返回响应
            ctx.response.body = {
                users,
                total,
                page,
                limit
            };
        });
    }
}