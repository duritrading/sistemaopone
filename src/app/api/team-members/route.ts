// pages/api/team-members.ts ou app/api/team-members/route.ts
export async function GET() {
  const { data } = await supabase
    .from('team_members')
    .select('id, full_name, email, primary_specialization')
    .eq('is_active', true)
    .order('full_name')
  
  return Response.json(data)
}