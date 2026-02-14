import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type UserRow = {
  id: string;
  name: string;
  created_at: string;
  role: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data: profiles } = await supabase.from('profiles').select('id, name, created_at');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');

    if (profiles && roles) {
      const roleMap = new Map(roles.map(r => [r.user_id, r.role]));
      setUsers(profiles.map(p => ({
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        role: roleMap.get(p.id) ?? 'user',
      })));
    }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole as any })
      .eq('user_id', userId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Role updated' });
      load();
    }
  };

  const roleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'default';
    if (role === 'editor') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Users Management</h2>

      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-40">Change Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name || '(unnamed)'}</TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => changeRole(u.id, v)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
