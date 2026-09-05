import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// هذا الـ hook يرجع لك المستخدم الحالي + بروفايله (يشمل دوره: زبون/مصمم/طابع)
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  async function loadProfile(currentUser) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setProfileError(null);
      return;
    }

    // ما فيه ملف شخصي محفوظ (مثلًا لو التريغر ما اشتغل وقت التسجيل) —
    // نحاول ننشئه تلقائيًا من بيانات التسجيل المخزنة بحساب المستخدم
    const meta = currentUser.user_metadata || {};
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: currentUser.id,
        full_name: meta.full_name || currentUser.email,
        role: meta.role || "customer",
      })
      .select()
      .maybeSingle();

    if (created) {
      setProfile(created);
      setProfileError(null);
    } else {
      setProfile(null);
      setProfileError(insertError?.message || error?.message || "تعذر تحميل بيانات الحساب");
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          loadProfile(session.user);
        } else {
          setProfile(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return { user, profile, loading, profileError };
}
