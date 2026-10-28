'use client';
import type { DashboardModel } from '../hooks/useIotDashboard';
import { Icon, ToggleRow } from '../components/ui';

type Props = Pick<
  DashboardModel,
  | 'name'
  | 'email'
  | 'setName'
  | 'setEmail'
  | 'setEditingLinks'
  | 'editingLinks'
  | 'setSaved'
  | 'links'
  | 'setLinks'
  | 'storedProfile'
  | 'cancelProfile'
  | 'saveProfile'
  | 'saved'
  | 'logout'
>;

// Chỉnh sửa thông tin cá nhân và liên kết.
export default function Profile({
  name,
  email,
  setName,
  setEmail,
  setEditingLinks,
  editingLinks,
  setSaved,
  links,
  setLinks,
  storedProfile,
  cancelProfile,
  saveProfile,
  saved,
  logout,
}: Props) {
  return (<>
    <div className="page-heading">
      <div>
        <div className="eyebrow">TÀI KHOẢN CỦA BẠN</div>
        <h1>Hồ sơ cá nhân</h1>
        <p>Quản lý thông tin và tùy chọn tài khoản.</p>
      </div>
      <span className="profile-status">
        <i />
        Tài khoản đang hoạt động</span>
    </div>
    <div className="profile-layout">
      <section className="panel profile-main">
        <div className="profile-banner">
          <div className="profile-avatar">
            {name.charAt(0)}
          </div>
          <div>
            <h2>
              {name}
            </h2>
            <p>
              {email}
            </p>
            <span className="role-pill">✦ Quản trị viên</span>
          </div>
          <button className="outline-button" onClick={() => document.getElementById('profile-name')?.focus()}>Chỉnh sửa hồ sơ</button>
        </div>
        <div className="profile-section">
          <div className="section-title">
            <div>
              <h3>Thông tin cá nhân</h3>
              <p>Các thông tin cơ bản của tài khoản</p>
            </div>
            <span className="section-number">01</span>
          </div>
          <div className="profile-fields">
            <label>HỌ VÀ TÊN
              <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>ĐỊA CHỈ EMAIL
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
        </div>
        <div className="profile-section">
          <div className="section-title">
            <div>
              <h3>Liên kết dự án</h3>
              <p>Tài nguyên liên quan đến đồ án IoT</p>
            </div>
            <span className="section-number">02</span>
          </div>
          <div className="project-links-heading">
            <button className="text-button" onClick={() => { setEditingLinks(!editingLinks); setSaved(false); }}>
              {editingLinks ? 'Xem liên kết đã lưu' : 'Chỉnh sửa liên kết'}
            </button>
          </div>
          <div className="profile-fields links-fields">
            {([{ key: 'github', label: 'GITHUB' }, { key: 'figma', label: 'FIGMA' }, { key: 'postman', label: 'POSTMAN' }, { key: 'report', label: 'LINK BÁO CÁO' }] as const).map(({ key, label }) => <div className="project-link-field" key={key}>
              <label htmlFor={editingLinks ? 'link-' + key : undefined}>
                {label}
              </label>
              {editingLinks ? <input id={'link-' + key} type="url" placeholder="https://..." value={links[key]} onChange={e => { setLinks(old => ({ ...old, [key]: e.target.value })); setSaved(false); }} /> : /^https?:$/.test((() => {
                try {
                  return new URL(storedProfile.links[key]).protocol;
                }
                catch {
                  return '';
                }
              })()) ? <a className="project-link" href={storedProfile.links[key]} target="_blank" rel="noopener noreferrer" title={storedProfile.links[key]}>
                <span>
                  {storedProfile.links[key]}
                </span>
                <span aria-hidden="true"> &#8599;</span>
              </a> : <span className="empty-project-link">Chưa thêm liên kết</span>}
            </div>)}
          </div>
        </div>
        <div className="profile-actions">
          <button className="outline-button" onClick={cancelProfile}>Hủy thay đổi</button>
          <button className="primary-button" onClick={saveProfile}>✓
            <span>
              {saved ? 'Đã lưu thay đổi' : 'Lưu thay đổi'}
            </span>
          </button>
        </div>
      </section>
      <aside className="profile-side">
        <section className="panel profile-security">
          <div className="side-icon">
            <Icon name="cpu" />
          </div>
          <h3>Bảo mật tài khoản</h3>
          <p>Quản lý phiên đăng nhập.</p>
          <button className="outline-button" onClick={logout}>
            <Icon name="logout" size={15} />
            Đăng xuất</button>
        </section>
        <section className="panel notification-panel">
          <h3>Cài đặt thông báo</h3>
          <p>Chọn cách bạn muốn nhận cập nhật.</p>
          <ToggleRow title="Thông báo trong ứng dụng" description="Cảnh báo trực tiếp khi có sự kiện" />
        </section>
      </aside>
    </div>
  </>);
}
