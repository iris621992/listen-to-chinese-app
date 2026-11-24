"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserAuthClient } from "@/lib/supabase/authBrowser";

type Props = {
  signIn: string;
  account: string;
  hrefFor: (path: string) => string;
  className: string;
  onNavigate?: () => void;
};

export function LearnerAuthLink({ signIn, account, hrefFor, className, onNavigate }: Props) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const auth = getBrowserAuthClient().auth;
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session?.user?.id));
    });
    void auth.getUser().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.user?.id));
    }).catch(() => {
      if (active) setSignedIn(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return <Link className={className} href={hrefFor(signedIn ? "/account" : "/login")} onClick={onNavigate}>
    {signedIn ? account : signIn}
  </Link>;
}
