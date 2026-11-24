import Link from "next/link";
import { signupLearner } from "@/app/auth/actions";
import { AccountCard, AccountField, styles } from "@/app/auth/AccountUi";
import { accountHref, resolveAccountLocale } from "@/lib/auth/accountLocale";

type Props = { searchParams: Promise<{ uiLang?: string; lang?: string; error?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = resolveAccountLocale(params);
  const vi = locale === "vi";
  return <AccountCard title={vi ? "Tạo tài khoản" : "Create account"} description={vi ? "Tạo tài khoản để sử dụng các tính năng dành cho người học khi được triển khai." : "Create an account for learner features as they become available."}>
    {params.error ? <p className={styles.error} role="alert">{vi ? "Không thể tạo tài khoản. Vui lòng kiểm tra thông tin và thử lại." : "Unable to create your account. Check the form and try again."}</p> : null}
    <form className={styles.form} action={signupLearner}>
      <input type="hidden" name="uiLang" value={locale}/>
      <AccountField name="email" label="Email" type="email" autoComplete="email" maxLength={254}/>
      <AccountField name="password" label={vi ? "Mật khẩu (ít nhất 8 ký tự)" : "Password (at least 8 characters)"} type="password" autoComplete="new-password" minLength={8} maxLength={128}/>
      <AccountField name="confirmPassword" label={vi ? "Nhập lại mật khẩu" : "Confirm password"} type="password" autoComplete="new-password" minLength={8} maxLength={128}/>
      <button type="submit" className={styles.button}>{vi ? "Tạo tài khoản" : "Create account"}</button>
    </form>
    <div className={styles.actions}><Link className={styles.link} href={accountHref("/login", locale)}>{vi ? "Đã có tài khoản? Đăng nhập" : "Already have an account? Sign in"}</Link></div>
  </AccountCard>;
}
