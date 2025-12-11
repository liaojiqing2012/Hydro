import { Context, Service, Handler, Schema, UserModel, DomainModel, UserFacingError, ForbiddenError, PRIV, PERM } from 'hydrooj';
import { join } from 'path';

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
    // 添加prepare方法，检查管理页面所需权限
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }
    
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
    // 添加prepare方法，检查管理页面所需权限
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }
    
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

// API Handler类
class UserApiHandler extends Handler {
    async get() {
        const uid = this.request.params.uid;
        
        if (uid) {
            // 获取单个用户详情
            const user = await UserModel.getById(uid);
            if (!user) {
                throw new UserFacingError('User not found');
            }
            this.response.body = user;
        } else {
            // 获取用户列表
            const page = parseInt(this.request.query.page || '1');
            const limit = parseInt(this.request.query.limit || '20');
            const skip = (page - 1) * limit;
            const keyword = this.request.query.q as string;
            const sort = this.request.query.sort as string || 'uid';
            const order = this.request.query.order as string || 'asc';
            
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
    
    async post() {
        const uid = this.request.params.uid;
        const { action } = this.request.body;
        
        if (!uid) {
            // 批量操作
            const { uids } = this.request.body;
            
            if (!uids || !Array.isArray(uids) || uids.length === 0) {
                throw new UserFacingError('No users selected');
            }
            
            // 批量操作
            switch (action) {
                case 'delete':
                    // 批量删除用户
                    await Promise.all(
                        uids.map(uid => UserModel.remove(uid))
                    );
                    break;
                
                case 'enable':
                    // 批量启用用户
                    await Promise.all(
                        uids.map(uid => UserModel.update(uid, { disabled: false }))
                    );
                    break;
                
                case 'disable':
                    // 批量禁用用户
                    await Promise.all(
                        uids.map(uid => UserModel.update(uid, { disabled: true }))
                    );
                    break;
                
                default:
                    throw new UserFacingError('Invalid action');
            }
            
            this.response.body = { success: true, action, count: uids.length };
            return;
        }
        
        // 单个用户操作
        const user = await UserModel.getById(uid);
        if (!user) {
            throw new UserFacingError('User not found');
        }
        
        switch (action) {
            case 'update':
                // 更新用户信息
                const { 
                    displayName, 
                    studentId, 
                    school, 
                    home, 
                    permission 
                } = this.request.body;
                
                // 添加参数验证
                if (permission && typeof permission !== 'string') {
                    throw new UserFacingError('Invalid permission format');
                }
                
                await UserModel.update(uid, {
                    displayName,
                    studentId,
                    school,
                    home,
                    permission
                });
                break;
            
            case 'change-password':
                // 修改密码
                const { password } = this.request.body;
                if (!password || password.length < 6) {
                    throw new UserFacingError('Password must be at least 6 characters');
                }
                await UserModel.setPassword(uid, password);
                break;
            
            case 'toggle-status':
                // 切换用户状态
                const newStatus = !user.disabled;
                await UserModel.update(uid, {
                    disabled: newStatus
                });
                this.response.body = { success: true, disabled: newStatus };
                return;
            
            case 'delete':
                // 删除用户
                await UserModel.remove(uid);
                break;
            
            default:
                throw new UserFacingError('Invalid action');
        }
        
        this.response.body = { success: true };
    }
    
    async delete() {
        const uid = this.request.params.uid;
        
        // 检查是否存在该用户
        const user = await UserModel.getById(uid);
        if (!user) {
            throw new UserFacingError('User not found');
        }
        
        // 删除用户
        await UserModel.remove(uid);
        
        this.response.body = { success: true };
    }
}

// 用户域权限API Handler
class UserDomainsApiHandler extends Handler {
    async get() {
        const uid = this.request.params.uid;
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
        this.response.body = userDomains.filter(Boolean);
    }
}

export default class UserManagementService extends Service {
    // 添加ui服务依赖，修复cannot get property "ui" without inject错误
    static inject = ['server', 'ui'];
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
        // 使用唯一的路由名称，避免与系统路由冲突
        ctx.Route('user_management_list', '/manage/users', UserListHandler, PRIV.PRIV_EDIT_SYSTEM);
        ctx.Route('user_management_detail', '/manage/users/:uid', UserDetailHandler, PRIV.PRIV_EDIT_SYSTEM);
        ctx.Route('user_management_domains', '/manage/users/:uid/domains', UserDomainsHandler, PRIV.PRIV_EDIT_SYSTEM);
        
        // 使用唯一的API路由名称
        ctx.Route('user_management_api_list', '/api/manage/users', UserApiHandler, PRIV.PRIV_EDIT_SYSTEM);
        ctx.Route('user_management_api_detail', '/api/manage/users/:uid', UserApiHandler, PRIV.PRIV_EDIT_SYSTEM);
        ctx.Route('user_management_api_domains', '/api/manage/users/:uid/domains', UserDomainsApiHandler, PRIV.PRIV_EDIT_SYSTEM);
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
}