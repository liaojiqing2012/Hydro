import { Context, Service, Handler, Schema, UserModel, DomainModel, UserFacingError, ForbiddenError, PRIV } from 'hydrooj';
import { join } from 'path';

export default class UserManagementService extends Service {
    static inject = ['server', 'renderer'];
    static Config = Schema.object({
        enabled: Schema.boolean().default(true),
        adminOnly: Schema.boolean().default(true),
    });

    private templatePath: string;

    constructor(ctx: Context, config: ReturnType<typeof UserManagementService.Config>) {
        super(ctx, 'user-management');
        if (!config.enabled) return;

        // 设置模板路径
        this.templatePath = join(__dirname, 'templates');
        
        // 注册路由
        this.registerRoutes(ctx);
        
        // 注册页面
        this.registerPages(ctx);
    }

    private registerRoutes(ctx: Context) {
        // 用户管理页面路由
        ctx.server.get('/admin/users', this.requireAdmin(), this.renderUserList.bind(this));
        ctx.server.get('/admin/users/:uid', this.requireAdmin(), this.renderUserDetail.bind(this));
        ctx.server.get('/admin/users/:uid/domains', this.requireAdmin(), this.renderUserDomains.bind(this));
        
        // API路由
        ctx.server.get('/api/admin/users', this.requireAdmin(), this.getUsers.bind(this));
        ctx.server.get('/api/admin/users/:uid', this.requireAdmin(), this.getUserDetail.bind(this));
        ctx.server.post('/api/admin/users/:uid/update', this.requireAdmin(), this.updateUser.bind(this));
        ctx.server.post('/api/admin/users/:uid/change-password', this.requireAdmin(), this.changePassword.bind(this));
        ctx.server.get('/api/admin/users/:uid/domains', this.requireAdmin(), this.getUserDomains.bind(this));
    }

    private registerPages(ctx: Context) {
        // 注入到管理菜单
        ctx.ui.inject('ControlPanel', 'user-management', {
            text: '用户管理',
            href: '/admin/users',
            icon: 'account--multiple',
            order: 100
        }, PRIV.PRIV_EDIT_SYSTEM);
    }
    
    private async renderUserList(ctx: Handler) {
        await ctx.render(join(this.templatePath, 'user_management.html'));
    }
    
    private async renderUserDetail(ctx: Handler) {
        await ctx.render(join(this.templatePath, 'user_management.html'));
    }
    
    private async renderUserDomains(ctx: Handler) {
        await ctx.render(join(this.templatePath, 'user_management.html'));
    }

    private requireAdmin(): Handler {
        return async (ctx: Handler, next: () => Promise<void>) => {
            if (!ctx.user || !ctx.user.hasPrivilege(PRIV.PRIV_EDIT_SYSTEM)) {
                throw new ForbiddenError('Permission denied');
            }
            await next();
        };
    }

    private async getUsers(ctx: Handler) {
        const page = parseInt(ctx.request.query.page || '1');
        const limit = parseInt(ctx.request.query.limit || '20');
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            UserModel.getList({}, skip, limit),
            UserModel.count({})
        ]);

        ctx.response.body = {
            users,
            total,
            page,
            limit
        };
    }

    private async getUserDetail(ctx: Handler) {
        const uid = ctx.request.params.uid;
        const user = await UserModel.getById(uid);
        if (!user) {
            throw new UserFacingError('User not found');
        }
        ctx.response.body = user;
    }

    private async updateUser(ctx: Handler) {
        const uid = ctx.request.params.uid;
        const { home, permission } = ctx.request.body;

        await UserModel.update(uid, {
            home,
            permission
        });

        ctx.response.body = { success: true };
    }

    private async changePassword(ctx: Handler) {
        const uid = ctx.request.params.uid;
        const { password } = ctx.request.body;

        if (!password || password.length < 6) {
            throw new UserFacingError('Password must be at least 6 characters');
        }

        await UserModel.setPassword(uid, password);
        ctx.response.body = { success: true };
    }

    private async getUserDomains(ctx: Handler) {
        const uid = ctx.request.params.uid;
        const domains = await DomainModel.getList({});
        const userDomains = [];

        for (const domain of domains) {
            const userInDomain = await DomainModel.getUser(domain._id, uid);
            if (userInDomain) {
                userDomains.push({
                    domain: domain._id,
                    name: domain.name,
                    permission: userInDomain.permission,
                    role: userInDomain.role
                });
            }
        }

        ctx.response.body = userDomains;
    }
}