import {
    BUILTIN_ROLES,
    Context,
    db,
    DomainModel,
    Handler,
    param,
    PRIV,
    Types,
    UserModel,
    UserNotFoundError,
} from 'hydrooj';

interface UserHomepageDoc {
    uid: number;
    homepage?: string;
    updatedAt: Date;
}

const homepageColl = db.collection<UserHomepageDoc>('userManagement.homepage');

async function resolveUser(domainId: string, key: string) {
    const identifier = key.trim();
    const byId = identifier.match(/^\d+$/) ? Number(identifier) : null;
    if (byId !== null) return UserModel.getById(domainId, byId);
    return UserModel.getByUname(domainId, identifier);
}

class UserManagementPageHandler extends Handler {
    async get() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        this.response.template = 'user_management.html';
    }
}

class UserManagementFetchHandler extends Handler {
    @param('key', Types.String)
    async get({ domainId }, key: string) {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        const udoc = await resolveUser(domainId, key);
        if (!udoc) throw new UserNotFoundError(key);
        const homepage = await homepageColl.findOne({ uid: udoc._id });
        const domainEntries = await DomainModel.collUser.find({ uid: udoc._id }).toArray();
        const domains = await DomainModel.getList(domainEntries.map((i) => i.domainId));
        const permByRole = (ddoc: any, role: string) => {
            if (ddoc?.roles?.[role]) return BigInt(ddoc.roles[role]).toString();
            return (BUILTIN_ROLES[role] || BUILTIN_ROLES.default || 0n).toString();
        };
        const domainPerms = domainEntries.map((entry) => ({
            domainId: entry.domainId,
            domainName: domains[entry.domainId]?.name || entry.domainId,
            role: entry.role || 'default',
            join: !!entry.join,
            perm: permByRole(domains[entry.domainId], entry.role || 'default'),
        }));
        const user = await udoc.private();
        this.response.body = {
            user: user.serialize(this),
            homepage: homepage?.homepage || '',
            domains: domainPerms,
        };
    }
}

class UserManagementPasswordHandler extends Handler {
    @param('uid', Types.Int)
    @param('password', Types.Password)
    async post({ uid, password }: { uid: number, password: string }) {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        await UserModel.setPassword(uid, password);
        this.response.body = { ok: true };
    }
}

class UserManagementPrivHandler extends Handler {
    @param('uid', Types.Int)
    @param('priv', Types.Int)
    async post({ uid, priv }: { uid: number, priv: number }) {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        await UserModel.setById(uid, { priv });
        this.response.body = { ok: true };
    }
}

class UserManagementHomepageHandler extends Handler {
    @param('uid', Types.Int)
    @param('homepage', Types.String)
    async post({ uid, homepage }: { uid: number, homepage: string }) {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
        await homepageColl.updateOne(
            { uid },
            { $set: { homepage, updatedAt: new Date() } },
            { upsert: true },
        );
        this.response.body = { ok: true };
    }
}

export function apply(ctx: Context) {
    ctx.Route('user_management', '/manage/user-management', UserManagementPageHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('user_management_fetch', '/api/manage/user-management/user', UserManagementFetchHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('user_management_password', '/api/manage/user-management/password', UserManagementPasswordHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('user_management_priv', '/api/manage/user-management/priv', UserManagementPrivHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('user_management_homepage', '/api/manage/user-management/homepage', UserManagementHomepageHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.injectUI('ControlPanel', 'user_management', { icon: 'user' }, PRIV.PRIV_EDIT_SYSTEM);
    ctx.i18n.load('zh', {
        user_management: '用户管理',
        'user_management.title': '用户管理',
        'user_management.search.placeholder': '输入用户 ID 或用户名',
        'user_management.search': '加载用户',
        'user_management.password': '重置密码',
        'user_management.password.placeholder': '新密码',
        'user_management.priv': '系统权限',
        'user_management.homepage': '主页地址',
        'user_management.domains': '域内权限',
    });
    ctx.i18n.load('en', {
        user_management: 'User Management',
        'user_management.title': 'User Management',
        'user_management.search.placeholder': 'Enter user ID or username',
        'user_management.search': 'Load user',
        'user_management.password': 'Reset password',
        'user_management.password.placeholder': 'New password',
        'user_management.priv': 'Privilege',
        'user_management.homepage': 'Homepage URL',
        'user_management.domains': 'Domain permissions',
    });
}
