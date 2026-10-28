'use client';
import type { DashboardModel } from '../hooks/useIotDashboard';
import { Icon } from '../components/ui';

type Props = Pick<
  DashboardModel,
  | 'signIn'
  | 'name'
  | 'mode'
  | 'setName'
  | 'email'
  | 'setEmail'
  | 'showPassword'
  | 'password'
  | 'setPassword'
  | 'setShowPassword'
  | 'confirmPassword'
  | 'setConfirmPassword'
  | 'notice'
  | 'setMode'
>;

// Đăng nhập và đăng ký.
export default function Login({
  signIn,
  name,
  mode,
  setName,
  email,
  setEmail,
  showPassword,
  password,
  setPassword,
  setShowPassword,
  confirmPassword,
  setConfirmPassword,
  notice,
  setMode,
}: Props) {
  return (<main className="login-screen">
    <form className="login-card" onSubmit={signIn}>
      <div className="brand-mark">
        <Icon name="cpu" size={25} />
      </div>
      <div className="login-brand">IoT</div>
      <h1>
        {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
      </h1>
      <p className="login-subtitle">Giám sát không gian sống của bạn</p>
      {mode === 'register' && <label>HỌ VÀ TÊN
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn An" />
      </label>}
      <label>
        {mode === 'login' ? 'TÊN ĐĂNG NHẬP / EMAIL' : 'EMAIL'}
        <input required type={mode === 'login' ? 'text' : 'email'} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nhap.email@vi.du.com" />
      </label>
      <label>MẬT KHẨU
        <div className="password-wrap">
          <input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
      </label>
      {mode === 'register' && <label>XÁC NHẬN MẬT KHẨU
        <input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" />
      </label>}
      {notice && <p className="login-message" role="status">
        {notice}
      </p>}
      <button className="primary-button login-submit" type="submit">
        {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        <Icon name="chevron" size={16} />
      </button>
      <div className="login-divider">
        <span />
      </div>
      <p className="login-switch">
        {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
        </button>
      </p>
    </form>
    <div className="login-decoration decor-one" />
    <div className="login-decoration decor-two" />
  </main>);
}
