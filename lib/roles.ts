import { supabaseServer, supabaseAdmin } from './supabase/server';

export type Role = 'director' | 'supervisor' | 'delivery' | 'member';
export type MemberStatus = 'unpaid' | 'pending' | 'approved' | 'withdrawn';

export interface Access {
  userId: string;
  role: Role;
  status: MemberStatus;
  approved: boolean;   // 앱 사용 가능 여부 (직원은 항상 true)
  isApprover: boolean; // director/supervisor
}

/** 현재 로그인 사용자의 역할/승인상태. 미로그인 null. */
export async function getAccess(): Promise<Access | null> {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return null;
  const sb = supabaseAdmin();

  const { data: staff } = await sb.from('staff').select('role').eq('auth_user_id', user.id).maybeSingle();
  if (staff) {
    const role = staff.role as Role;
    return { userId: user.id, role, status: 'approved', approved: true, isApprover: role === 'director' || role === 'supervisor' };
  }

  const { data: cust } = await sb.from('customer').select('status').eq('auth_user_id', user.id).maybeSingle();
  const status = (cust?.status as MemberStatus) ?? 'unpaid';
  return { userId: user.id, role: 'member', status, approved: status === 'approved', isApprover: false };
}
