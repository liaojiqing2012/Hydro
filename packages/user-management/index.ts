import { Context, Service, Handler, Schema, UserModel, DomainModel, UserFacingError, ForbiddenError, PRIV, PERM } from 'hydrooj';
import { join } from 'path';

// 用户列表页面Handler
class UserListHandler extends Handler {
    async get() {
        // 获取分页和搜索参数
        const page = parseInt(this.request.query.page || '1');
        const limit = parseInt(this.request.query.limit || '20');
        const skip = (page - 1) * limit;
        const keyword = this.request.query.q || '';
        const sort = this.request.query.sort || 'uid';
        const order = this.request.query.order || 'asc';
        
        // 构建搜索条件
        const query: any = {};
        if (keyword) {
            query.$or = [
                { uname: { $regex: keyword, $options: 'i' } },
                { mail: { $regex: keyword, $options: 'i' } },
                { _id: keyword }
            ];
        }
        
        // 获取用户列表数据
        const [users, total] = await Promise.all([
            UserModel.getList(query, skip, limit),
            UserModel.count(query)
        ]);
        
        const totalPages = Math.ceil(total / limit);
        
        // 渲染用户列表页面
        this.response.template = 'user_management.html';
        this.response.body = {
            title: '用户管理',
            users,
            total,
            totalPages,
            page,
            keyword,
            sort,
            order,
        };
    }
}

// 用户详情页面Handler
class UserDetailHandler extends Handler {
    async get() {
        // 渲染用户详情页面
        const uid = this.request.params.uid;
        const user = await UserModel.getById(uid);
        
        if (!user) {
            throw new UserFacingError('User not found');
        }
        
        // 获取用户域权限
        const domains = await DomainModel.getList({});
        const userDomains = await Promise.all(
            domains.map(async (domain) => {
                const userInDomain = await DomainModel.getUser(domain._id, uid);
                if (userInDomain) {
                    return {
                        domain: domain._id,
                        name: domain.name,
                        permission: userInDomain.permission,
                        role: userInDomain.role
                    };
                }
                return null;
            })
        );
        
        this.response.template = 'user_management.html';
        this.response.body = {
            title: '用户详情',
            uid,
            user,
            userDomains: userDomains.filter(Boolean),
            domains
        };
    }
}

// 用户域权限页面Handler
class UserDomainsHandler extends Handler {
    async get() {
        // 渲染用户域权限页面
        const uid = this.request.params.uid;
        const user = await UserModel.getById(uid);
        
        if (!user) {
            throw new UserFacingError('User not found');
        }
        
        // 获取用户域权限
        const domains = await DomainModel.getList({});
        const userDomains = await Promise.all(
            domains.map(async (domain) => {
                const userInDomain = await DomainModel.getUser(domain._id, uid);
                if (userInDomain) {
                    return {
                        domain: domain._id,
                        name: domain.name,
                        permission: userInDomain.permission,
                        role: userInDomain.role
                    };
                }
                return null;
            })
        );
        
        this.response.template = 'user_management.html';
        this.response.body = {
            title: '用户域权限',
            uid,
            user,
            userDomains: userDomains.filter(Boolean),
            domains
        };
    }
}

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
        // 使用ctx.Route注册页面路由
        ctx.Route('user_management', '/manage/users', UserListHandler, PRIV.PRIV_EDIT_SYSTEM);
        ctx.Route('user_detail', '/manage/users/:uid', UserDetailHandler, PRIV.PRIV_EDIT_SYSTEM);
        ctx.Route('user_domains', '/manage/users/:uid/domains', UserDomainsHandler, PRIV.PRIV_EDIT_SYSTEM);
        
        // API路由（继续使用ctx.server.get）
        ctx.server.get('/api/manage/users', this.requireAdmin(), this.getUsers.bind(this));
        ctx.server.get('/api/manage/users/:uid', this.requireAdmin(), this.getUserDetail.bind(this));
        ctx.server.post('/api/manage/users/:uid/update', this.requireAdmin(), this.updateUser.bind(this));
        ctx.server.post('/api/manage/users/:uid/change-password', this.requireAdmin(), this.changePassword.bind(this));
        ctx.server.get('/api/manage/users/:uid/domains', this.requireAdmin(), this.getUserDomains.bind(this));
    }

    private registerPages(ctx: Context) {
        // 注入到管理菜单
        ctx.ui.inject('ControlPanel', 'user-management', {
            text: '用户管理',
            href: '/manage/users',
            icon: 'account--multiple',
            order: 100
        }, PRIV.PRIV_EDIT_SYSTEM);
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
        const keyword = ctx.request.query.q as string;
        const sort = ctx.request.query.sort as string || 'uid';
        const order = ctx.request.query.order as string || 'asc';
        
        // 构建搜索条件
        const query: any = {};
        if (keyword) {
            query.$or = [
                { uname: { $regex: keyword, $options: 'i' } },
                { mail: { $regex: keyword, $options: 'i' } },
                { _id: keyword }
            ];
        }

        const [users, total] = await Promise.all([
            UserModel.getList(query, skip, limit),
            UserModel.count(query)
        ]);

        ctx.response.body = {
            users,
            total,
            page,
            limit,
            sort,
            order
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
        
        // 添加参数验证
        if (permission && typeof permission !== 'string') {
            throw new UserFacingError('Invalid permission format');
        }
        
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
        
        // 并行查询所有域的用户权限，提高效率
        const userDomains = await Promise.all(
            domains.map(async (domain) => {
                const userInDomain = await DomainModel.getUser(domain._id, uid);
                if (userInDomain) {
                    return {
                        domain: domain._id,
                        name: domain.name,
                        permission: userInDomain.permission,
                        role: userInDomain.role
                    };
                }
                return null;
            })
        );
        
        // 过滤掉null值
        ctx.response.body = userDomains.filter(Boolean);
    }
}