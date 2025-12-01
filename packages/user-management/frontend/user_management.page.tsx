import {
  addPage,
  NamedPage,
  Notification,
  React,
  ReactDOM,
  request,
  i18n,
} from '@hydrooj/ui-default';

type DomainEntry = {
  domainId: string;
  domainName: string;
  role: string;
  perm: string;
  join: boolean;
};

type UserPayload = {
  user: any;
  homepage: string;
  domains: DomainEntry[];
};

function DomainTable({ domains }: { domains: DomainEntry[] }) {
  if (!domains.length) return <p className="no-data">{i18n('None')}</p>;
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>{i18n('Domain')}</th>
          <th>{i18n('Role')}</th>
          <th>{i18n('Permission')}</th>
          <th>{i18n('Status')}</th>
        </tr>
      </thead>
      <tbody>
        {domains.map((item) => (
          <tr key={`${item.domainId}-${item.role}`}>
            <td>{item.domainName}</td>
            <td>{item.role}</td>
            <td>{item.perm}</td>
            <td>{item.join ? i18n('Joined') : i18n('Pending')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UserManagementApp() {
  const [query, setQuery] = React.useState('');
  const [payload, setPayload] = React.useState<UserPayload | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [priv, setPriv] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [homepage, setHomepage] = React.useState('');

  const loadUser = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await request.get('/api/manage/user-management/user', { key: query.trim() });
      setPayload(data);
      setPriv(String(data.user?.priv ?? ''));
      setHomepage(data.homepage || '');
      setPassword('');
    } catch (e) {
      Notification.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePriv = async () => {
    if (!payload?.user?._id) return;
    try {
      await request.post('/api/manage/user-management/priv', { uid: payload.user._id, priv: Number(priv) });
      Notification.success(i18n('Saved'));
    } catch (e) {
      Notification.error(e.message);
    }
  };

  const updatePassword = async () => {
    if (!payload?.user?._id || !password) return;
    try {
      await request.post('/api/manage/user-management/password', { uid: payload.user._id, password });
      Notification.success(i18n('Saved'));
      setPassword('');
    } catch (e) {
      Notification.error(e.message);
    }
  };

  const updateHomepage = async () => {
    if (!payload?.user?._id) return;
    try {
      await request.post('/api/manage/user-management/homepage', { uid: payload.user._id, homepage });
      Notification.success(i18n('Saved'));
    } catch (e) {
      Notification.error(e.message);
    }
  };

  return (
    <div className="form">
      <div className="input-group">
        <input
          type="text"
          placeholder={i18n('user_management.search.placeholder')}
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
        />
        <button className="primary button" disabled={loading} onClick={loadUser}>
          {loading ? i18n('Loading...') : i18n('user_management.search')}
        </button>
      </div>

      {payload?.user && (
        <div className="user-management__panel">
          <div className="section">
            <div className="section__header">
              <h3 className="section__title">{payload.user.uname}</h3>
            </div>
            <div className="section__body">
              <p>
                <strong>UID:</strong> {payload.user._id}
              </p>
              <p>
                <strong>{i18n('user_management.priv')}:</strong>
                <input
                  type="number"
                  value={priv}
                  onChange={(ev) => setPriv(ev.target.value)}
                  style={{ width: '140px', marginLeft: '8px' }}
                />
                <button className="button" style={{ marginLeft: '8px' }} onClick={updatePriv}>
                  {i18n('Save')}
                </button>
              </p>
              <p className="user-management__password">
                <strong>{i18n('user_management.password')}:</strong>
                <input
                  type="password"
                  value={password}
                  placeholder={i18n('user_management.password.placeholder')}
                  onChange={(ev) => setPassword(ev.target.value)}
                  style={{ width: '200px', marginLeft: '8px' }}
                />
                <button className="button" style={{ marginLeft: '8px' }} onClick={updatePassword}>
                  {i18n('Save')}
                </button>
              </p>
              <p className="user-management__homepage">
                <strong>{i18n('user_management.homepage')}:</strong>
                <input
                  type="text"
                  value={homepage}
                  onChange={(ev) => setHomepage(ev.target.value)}
                  style={{ width: '320px', marginLeft: '8px' }}
                />
                <button className="button" style={{ marginLeft: '8px' }} onClick={updateHomepage}>
                  {i18n('Save')}
                </button>
              </p>
            </div>
          </div>

          <div className="section">
            <div className="section__header">
              <h3 className="section__title">{i18n('user_management.domains')}</h3>
            </div>
            <div className="section__body no-padding">
              <DomainTable domains={payload.domains} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

addPage(new NamedPage('user_management', () => {
  const root = document.getElementById('user-management-app');
  if (!root) return;
  ReactDOM.createRoot(root).render(<UserManagementApp />);
}));
