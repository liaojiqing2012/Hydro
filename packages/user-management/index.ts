import { Context, Service, Handler, Schema, UserModel, DomainModel, UserFacingError, PRIV, db } from 'hydrooj';

// 用户列表页面Handler
class UserListHandler extends Handler {
    // 添加prepare方法，检查管理页面所需权限
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }
    
    async get() {
        // 获取分页和搜索参数
        const page = parseInt(this.request.query.page || '1');
        const limit = parseInt(this.request.query.limit || '20');
        const skip = (page - 1) * limit;
        const keyword = this.request.query.q || '';
        const sort = this.request.query.sort || 'uid';
        const order = this.request.query.order || 'asc';

        const sortKey = {
            uid: '_id',
            uname: 'uname',
            displayName: 'displayName',
            studentId: 'studentId',
            school: 'school',
            email: 'mail',
            regat: 'regat',
            loginat: 'loginat',
            role: 'role',
            priv: 'priv',
            loginip: 'loginip',
        }[sort] || '_id';
        const sortOrder = order === 'desc' ? -1 : 1;
        
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
        const userColl = db.collection('user');
        const [users, total] = await Promise.all([
            userColl
                .find(query)
                .sort({ [sortKey]: sortOrder })
                .skip(skip)
                .limit(limit)
                .toArray(),
            userColl.countDocuments(query),
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
    // 添加prepare方法，检查管理页面所需权限
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }
    
    async get() {
        // 渲染用户详情页面
        const uid = Number(this.request.params.uid);
        const user = await UserModel.getById(this.domainId, uid);
        
        if (!user) {
            throw new UserFacingError('User not found');
        }
        
        // 获取用户域权限
        const domains = await DomainModel.coll.find({}).toArray();
        const userDomains = await Promise.all(
            domains.map(async (domain) => {
                const userInDomain = await DomainModel.collUser.findOne({ domainId: domain._id, uid });
                if (userInDomain) {
                    return {
                        domain: domain._id,
                        name: domain.name,
                        permission: userInDomain.perm,
                        role: userInDomain.role,
                    };
                }
                return null;
            }),
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
    // 添加prepare方法，检查管理页面所需权限
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }
    
    async get() {
        // 渲染用户域权限页面
        const uid = Number(this.request.params.uid);
        const user = await UserModel.getById(this.domainId, uid);
        
        if (!user) {
            throw new UserFacingError('User not found');
        }
        
        // 获取用户域权限
        const domains = await DomainModel.coll.find({}).toArray();
        const userDomains = await Promise.all(
            domains.map(async (domain) => {
                const userInDomain = await DomainModel.collUser.findOne({ domainId: domain._id, uid });
                if (userInDomain) {
                    return {
                        domain: domain._id,
                        name: domain.name,
                        permission: userInDomain.perm,
                        role: userInDomain.role,
                    };
                }
                return null;
            }),
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
    static inject = ['server'];
    static Config = Schema.object({
        enabled: Schema.boolean().default(true),
        adminOnly: Schema.boolean().default(true),
    });

    constructor(ctx: Context, config: ReturnType<typeof UserManagementService.Config>) {
        super(ctx, 'user-management');
        if (!config.enabled) return;

        // 注册路由
        this.registerRoutes(ctx);
        
        // 注册页面
        this.registerPages(ctx);
    }

    private registerRoutes(ctx: Context) {
        // 使用ctx.Route注册页面路由
        // 注意：这里不需要再指定权限，因为Handler类的prepare方法已经检查了权限
        ctx.Route('user_management', '/manage/users', UserListHandler);
        ctx.Route('user_detail', '/manage/users/:uid', UserDetailHandler);
        ctx.Route('user_domains', '/manage/users/:uid/domains', UserDomainsHandler);

        // API 路由
        ctx.Route('api_manage_users', '/api/manage/users', ManageUsersApiHandler);
        ctx.Route('api_manage_user_detail', '/api/manage/users/:uid', ManageUserDetailApiHandler);
        ctx.Route('api_manage_user_update', '/api/manage/users/:uid/update', ManageUserUpdateApiHandler);
        ctx.Route('api_manage_user_change_password', '/api/manage/users/:uid/change-password', ManageUserChangePasswordApiHandler);
        ctx.Route('api_manage_user_domains', '/api/manage/users/:uid/domains', ManageUserDomainsApiHandler);
    }

    private registerPages(ctx: Context) {
        // 注入到管理菜单
        ctx.injectUI('ControlPanel', 'user_management', {
            icon: 'account--multiple',
            order: 100
        }, PRIV.PRIV_EDIT_SYSTEM);
    }

}

class ManageUsersApiHandler extends Handler {
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }

    async get() {
        const page = parseInt(this.request.query.page || '1');
        const limit = parseInt(this.request.query.limit || '20');
        const skip = (page - 1) * limit;
        const keyword = this.request.query.q as string;
        const sort = this.request.query.sort as string || 'uid';
        const order = this.request.query.order as string || 'asc';

        const sortKey = {
            uid: '_id',
            uname: 'uname',
            displayName: 'displayName',
            studentId: 'studentId',
            school: 'school',
            email: 'mail',
            regat: 'regat',
            loginat: 'loginat',
            role: 'role',
            priv: 'priv',
            loginip: 'loginip',
        }[sort] || '_id';
        const sortOrder = order === 'desc' ? -1 : 1;

        // 构建搜索条件
        const query: any = {};
        if (keyword) {
            query.$or = [
                { uname: { $regex: keyword, $options: 'i' } },
                { mail: { $regex: keyword, $options: 'i' } },
                { _id: keyword }
            ];
        }

        const userColl = db.collection('user');
        const [users, total] = await Promise.all([
            userColl
                .find(query)
                .sort({ [sortKey]: sortOrder })
                .skip(skip)
                .limit(limit)
                .toArray(),
            userColl.countDocuments(query),
        ]);

        this.response.body = {
            users,
            total,
            page,
            limit,
            sort,
            order
        };
    }
}

class ManageUserDetailApiHandler extends Handler {
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }

    async get() {
        const uid = Number(this.request.params.uid);
        const user = await UserModel.getById(this.domainId, uid);
        if (!user) {
            throw new UserFacingError('User not found');
        }
        this.response.body = user;
    }
}

class ManageUserUpdateApiHandler extends Handler {
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }

    async post() {
        const uid = Number(this.request.params.uid);
        const { home, permission } = this.request.body;

        // 添加参数验证
        if (permission && typeof permission !== 'string') {
            throw new UserFacingError('Invalid permission format');
        }

        const update: Record<string, any> = {};
        if (home !== undefined) update.home = home;
        if (permission !== undefined) {
            try {
                update.perm = BigInt(permission);
            } catch (e) {
                throw new UserFacingError('Invalid permission format');
            }
        }
        await UserModel.setById(uid, update);

        this.response.body = { success: true };
    }
}

class ManageUserChangePasswordApiHandler extends Handler {
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }

    async post() {
        const uid = Number(this.request.params.uid);
        const { password } = this.request.body;

        if (!password || password.length < 6) {
            throw new UserFacingError('Password must be at least 6 characters');
        }

        await UserModel.setPassword(uid, password);
        this.response.body = { success: true };
    }
}

class ManageUserDomainsApiHandler extends Handler {
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }

    async get() {
        const uid = Number(this.request.params.uid);
        const domains = await DomainModel.coll.find({}).toArray();

        // 并行查询所有域的用户权限，提高效率
        const userDomains = await Promise.all(
            domains.map(async (domain) => {
                const userInDomain = await DomainModel.collUser.findOne({ domainId: domain._id, uid });
                if (userInDomain) {
                    return {
                        domain: domain._id,
                        name: domain.name,
                        permission: userInDomain.perm,
                        role: userInDomain.role,
                    };
                }
                return null;
            }),
        );

        // 过滤掉null值
        this.response.body = userDomains.filter(Boolean);
    }
}