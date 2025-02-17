
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  full_name: string;
  admin: boolean;
}

export const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, admin, users:auth.users(email)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedUsers = profiles.map((profile: any) => ({
        id: profile.id,
        email: profile.users?.email,
        full_name: profile.full_name,
        admin: profile.admin,
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create user in Supabase Auth
      const { data: authUser, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (signUpError) throw signUpError;

      if (authUser.user) {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authUser.user.id,
            full_name: newUser.fullName,
            admin: false,
          },
        ]);

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "User created successfully",
        });

        setNewUser({ email: "", password: "", fullName: "" });
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>Manage users and view sessions</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={createUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={newUser.fullName}
              onChange={(e) =>
                setNewUser({ ...newUser, fullName: e.target.value })
              }
              required
            />
          </div>

          <Button type="submit">Create User</Button>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Users</h3>
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.admin && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </div>
  );
};
