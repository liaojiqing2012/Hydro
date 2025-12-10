import { escapeRegExp } from 'lodash';
import {
    Context, Handler, PRIV, Types, UserModel, param,
} from 'hydrooj';
import { Filter } from 'mongodb';
import { Udoc } from '@hydrooj/framework/lib/interface';

const PAGE_SIZE = 20;

class UserManagementHandler extends Handler {
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }

    @param('page', Types.PositiveInt, true)
    @param('q', Types.String, true)
    async get(domainId: string, page = 1, keyword = '') {
        const query: Filter<Udoc> = { _id: { $gte: 1 } };
        if (keyword) {
            const $regex = escapeRegExp(keyword.toLowerCase());
            query.$or = [
                { unameLower: { $regex } },
                { mailLower: { $regex } },
            ];
        }
        const skip = (Math.max(page, 1) - 1) * PAGE_SIZE;
        const [total, users] = await Promise.all([
            UserModel.coll.countDocuments(query),
            UserModel.getMulti(query, ['_id', 'uname', 'mail', 'role', 'priv', 'regat', 'loginat'])
                .sort({ _id: 1 })
                .skip(skip)
                .limit(PAGE_SIZE)
                .toArray(),
        ]);
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        this.response.body = {
            users,
            keyword,
            page: currentPage,
            total,
            totalPages,
            pageSize: PAGE_SIZE,
        };
        this.response.pjax = 'user_management.html';
        this.response.template = 'user_management.html';
    }
}

export async function apply(ctx: Context) {
    ctx.injectUI('ControlPanel', 'user_management', { icon: 'account--multiple' }, PRIV.PRIV_EDIT_SYSTEM);
    ctx.i18n.load('en', {
        user_management: 'User Management',
        user_management_description: 'Browse and audit user accounts.',
        user_management_keyword: 'Keyword',
        user_management_search: 'Search',
        user_management_uid: 'User ID',
        user_management_uname: 'Username',
        user_management_email: 'Email',
        user_management_role: 'Role',
        user_management_privilege: 'Privilege',
        user_management_registered: 'Registered At',
        user_management_last_login: 'Last Login',
        user_management_empty: 'No users matched your query.',
    });
    ctx.i18n.load('zh', {
        user_management: '用户管理',
        user_management_description: '浏览和审核用户账户。',
        user_management_keyword: '关键字',
        user_management_search: '搜索',
        user_management_uid: '用户 ID',
        user_management_uname: '用户名',
        user_management_email: '邮箱',
        user_management_role: '角色',
        user_management_privilege: '权限值',
        user_management_registered: '注册时间',
        user_management_last_login: '最近登录',
        user_management_empty: '没有符合条件的用户。',
    });
    ctx.Route('user_management', '/manage/users', UserManagementHandler);
}

