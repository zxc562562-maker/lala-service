import { supabaseAdmin } from './supabase/server';
import { getCachedUser } from './auth-cache';

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
  const user = await getCachedUser();
  if (!user) return null;
  const sb = supabaseAdmin();

  // staff/customer 조회는 서로 배타적으로 쓰이지만(둘 다 필요한 게 아니라 하나만 맞으면 됨),
  // 순서대로 기다리는 대신 항상 병렬로 미리 던져서 왕복 1회분을 절약한다.
  const [{ data: staff }, { data: cust }] = await Promise.all([
    sb.from('staff').select('role').eq('auth_user_id', user.id).maybeSingle(),
    sb.from('customer').select('status').eq('auth_user_id', user.id).maybeSingle(),
  ]);

  if (staff) {
    const role = staff.role as Role;
    return { userId: user.id, role, status: 'approved', approved: true, isApprover: role === 'director' || role === 'supervisor' };
  }

  const status = (cust?.status as MemberStatus) ?? 'unpaid';
  return { userId: user.id, role: 'member', status, approved: status === 'approved', isApprover: false };
}
