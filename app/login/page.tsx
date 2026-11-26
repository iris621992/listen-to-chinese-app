import Link from "next/link";
import { loginLearner } from "@/app/auth/actions";
import { AccountCard, AccountField, styles } from "@/app/auth/AccountUi";
import { accountHref, resolveAccountLocale } from "@/lib/auth/accountLocale";

type Props = { searchParams: Promise<{ uiLang?: string; lang?: string; check_email?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = resolveAccountLocale(params);
  const vi = locale === "vi";
  return <AccountCard title={vi ? "Đăng nhập" : "Sign in"} description={vi ? "Đăng nhập tài khoản học tiếng Trung của bạn." : "Sign in to your learner account."}>
    {params.check_email === "1" ? <p className={styles.notice} role="status">{vi ? "Hãy mở email để xác nhận tài khoản rồi đăng nhập." : "Check your email to confirm your account, then sign in."}</p> : null}
    {params.error ? <p className={styles.error} role="alert">{vi ? "Không thể đăng nhập. Kiểm tra thông tin hoặc email xác nhận và thử lại." : "Unable to sign in. Check your details or confirmation email and try again."}</p> : null}
    <form className={styles.form} action={loginLearner}>
      <input type="hidden" name="uiLang" value={locale}/>
      <AccountField name="email" label="Email" type="email" autoComplete="email" maxLength={254}/>
      <AccountField name="password" label={vi ? "Mật khẩu" : "Password"} type="password" autoComplete="current-password" maxLength={128}/>
      <button type="submit" className={styles.button}>{vi ? "Đăng nhập" : "Sign in"}</button>
    </form>
    <nav className={styles.actions}>
      <Link className={styles.link} href={accountHref("/signup", locale)}>{vi ? "Tạo tài khoản" : "Create account"}</Link>
      <Link className={styles.link} href={accountHref("/forgot-password", locale)}>{vi ? "Quên mật khẩu?" : "Forgot password?"}</Link>
    </nav>
  </AccountCard>;
}
