export function getUserDisplayName(
  profile: { full_name?: string | null } | null, 
  user: { email?: string; user_metadata?: any } | null
): string {
  if (profile?.full_name && profile.full_name !== "Usuário Sincronizado") {
    return profile.full_name;
  }
  
  const metaName = user?.user_metadata?.full_name || 
                   user?.user_metadata?.name || 
                   `${user?.user_metadata?.firstName || ''} ${user?.user_metadata?.lastName || ''}`.trim();
                   
  if (metaName) {
    return metaName;
  }
  
  if (user?.email) {
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }
  
  return "Usuário";
}

export function getUserFirstName(
  profile: { full_name?: string | null } | null, 
  user: { email?: string; user_metadata?: any } | null
): string {
  const displayName = getUserDisplayName(profile, user);
  return displayName.split(' ')[0];
}
