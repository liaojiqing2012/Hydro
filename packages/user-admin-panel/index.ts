import { omit } from 'lodash';
import {
    CannotEditSuperAdminError, Context, DomainModel, Handler,
    PERMS, PRIV, Types, UserModel, UserNotFoundError, requireSudo,
} from 'hydrooj';

const EditablePriv = omit(PRIV, ['PRIV_DEFAULT', 'PRIV_NEVER', 'PRIV_NONE', 'PRIV_ALL']);
const PrivEntries = Object.entries(EditablePriv) as Array<[string, number]>;

async function resolveUser(domainId: string, keyword?: string) {
    if (!keyword) return null;
    if (/^[-\d]+$/.test(keyword)) {
        const numeric = Number(keyword);
        if (!Number.isNaN(numeric)) {
            const byId = await UserModel.getById(domainId, numeric);
            if (byId) return byId;
        }
    }
    const byName = await UserModel.getByUname(domainId, keyword);
    if (byName) return byName;
    return await UserModel.getByEmail(domainId, keyword);
}

async function collectDomainPermissions(user: any) {
    const joinedDomains = await DomainModel.getDictUserByDomainId(user._id);
    const domainEntries = await Promise.all(Object.keys(joinedDomains).map(async (domainId) => {
        const [ddoc, dudoc] = await Promise.all([
            DomainModel.get(domainId),
            DomainModel.getDomainUser(domainId, user),
        ]);
        const perm = dudoc.perm || 0n;
        const permEntries = PERMS
            .filter((p) => (perm & p.key) === p.key)
            .map((p) => p.desc);
        return {
            domainId,
            domainName: ddoc?.name || domainId,
            role: dudoc.role || 'guest',
            permText: perm.toString(),
            permEntries,
        };
    }));
    domainEntries.sort((a, b) => a.domainName.localeCompare(b.domainName));
    return domainEntries;
}

class UserAdminBaseHandler extends Handler {
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }
}

class UserAdminPageHandler extends UserAdminBaseHandler {
    async get(domainId: string, keyword?: string) {
        const target = await resolveUser(domainId, keyword);
        const domainPermissions = target ? await collectDomainPermissions(target) : [];
        this.response.template = 'manage_user_admin.html';
        this.response.body = {
            keyword,
            target,
            domainPermissions,
            privEntries: PrivEntries,
            selectedPrivs: target
                ? PrivEntries.filter(([, value]) => (target.priv & value) === value).map(([, value]) => value)
                : [],
            searchError: keyword && !target ? this.translate('User not found') : '',
        };
    }
}

class UserAdminPasswordHandler extends UserAdminBaseHandler {
    @requireSudo
    @param('uid', Types.Int)
    @param('password', Types.Password)
    async post(domainId: string, uid: number, password: string) {
        const udoc = await UserModel.getById(domainId, uid);
        if (!udoc) throw new UserNotFoundError(uid);
        await UserModel.setPassword(uid, password);
        this.response.redirect = this.url('manage_user_admin', { keyword: uid });
    }
}

class UserAdminHomepageHandler extends UserAdminBaseHandler {
    @requireSudo
    @param('uid', Types.Int)
    @param('homepage', Types.String, true)
    async post(domainId: string, uid: number, homepage?: string) {
        const udoc = await UserModel.getById(domainId, uid);
        if (!udoc) throw new UserNotFoundError(uid);
        const $set: Record<string, any> = {};
        const $unset: Record<string, ''> = {} as any;
        if (homepage && homepage.trim()) $set.homepage = homepage.trim();
        else $unset.homepage = '';
        await UserModel.setById(uid, $set, $unset);
        this.response.redirect = this.url('manage_user_admin', { keyword: uid });
    }
}

class UserAdminPrivHandler extends UserAdminBaseHandler {
    @requireSudo
    @param('uid', Types.Int)
    @param('priv', Types.NumericArray, true)
    async post(domainId: string, uid: number, priv: number[] = []) {
        const udoc = await UserModel.getById(domainId, uid);
        if (!udoc) throw new UserNotFoundError(uid);
        if (udoc.priv === PRIV.PRIV_ALL) throw new CannotEditSuperAdminError();
        const allowed = new Set(PrivEntries.map(([, value]) => value));
        const normalizedPriv = (priv || []).map(Number).filter((i) => allowed.has(i));
        const nextPriv = normalizedPriv.reduce((prev, cur) => prev + cur, 0);
        await UserModel.setPriv(uid, nextPriv);
        this.response.redirect = this.url('manage_user_admin', { keyword: uid });
    }
}

export async function apply(ctx: Context) {
    ctx.Route('manage_user_admin', '/manage/user-admin', UserAdminPageHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('manage_user_admin_password', '/manage/user-admin/password', UserAdminPasswordHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('manage_user_admin_homepage', '/manage/user-admin/homepage', UserAdminHomepageHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.Route('manage_user_admin_priv', '/manage/user-admin/priv', UserAdminPrivHandler, PRIV.PRIV_EDIT_SYSTEM);
    ctx.injectUI('ControlPanel', 'manage_user_admin', { before: 'manage_user_priv', icon: 'user' }, PRIV.PRIV_EDIT_SYSTEM);
    ctx.i18n.load('en', {
        manage_user_admin: 'User Management',
        'User Management': 'User Management',
        'User not found': 'User not found',
        'User ID / Username / Email': 'User ID / Username / Email',
        'Load User': 'Load User',
        'Basic Information': 'Basic Information',
        'New Password': 'New Password',
        Homepage: 'Homepage',
        'Not set': 'Not set',
        'Update Password': 'Update Password',
        'Update Homepage': 'Update Homepage',
        'Update Privilege': 'Update Privilege',
        'Domain Permissions': 'Domain Permissions',
        Domain: 'Domain',
        Role: 'Role',
        'Permission Value': 'Permission Value',
        'Permission List': 'Permission List',
        'No joined domain records': 'No joined domain records',
        'No permission': 'No permission',
    });
    ctx.i18n.load('zh', {
        manage_user_admin: '用户管理',
        'User Management': '用户管理',
        'User not found': '未找到对应用户',
        'User ID / Username / Email': '用户 ID / 用户名 / 邮箱',
        'Load User': '加载用户',
        'Basic Information': '基本信息',
        'New Password': '新密码',
        Homepage: '主页',
        'Not set': '未设置',
        'Update Password': '更新密码',
        'Update Homepage': '更新主页',
        'Update Privilege': '更新权限',
        'Domain Permissions': '域内权限',
        Domain: '域',
        Role: '角色',
        'Permission Value': '权限值',
        'Permission List': '权限列表',
        'No joined domain records': '没有加入任何域',
        'No permission': '无权限',
    });
}
