import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MoreHorizontal, Search, UserPlus, Edit, Trash2, Ban, Upload, Camera } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { userService } from '../services';

function mapRoleToUi(role: string) {
  if (role === 'admin') return 'Admin';
  if (role === 'editor') return 'Premium';
  return 'User';
}

function mapStatusToUi(status: string) {
  if (status === 'active') return 'Active';
  if (status === 'inactive') return 'Inactive';
  return 'Banned';
}

export function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  useEffect(() => {
    const unsub = userService.subscribeToUsers({}, (list) => {
      const normalized = list.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: mapRoleToUi(u.role),
        status: mapStatusToUi(u.status),
        imageUrl: u.avatar,
        joinedDate: u.createdAt || new Date().toISOString()
      }));
      setUsers(normalized);
    });
    return unsub;
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter;
    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    if (status === "Active") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{status}</Badge>;
    } else if (status === "Inactive") {
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">{status}</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "Admin") {
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">{role}</Badge>;
    } else if (role === "Premium") {
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">{role}</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">{role}</Badge>;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const result = await userService.deleteUser(userId);
      if (result.success) {
        // User will be removed from the list via Firebase subscription
        alert('User deleted successfully');
      } else {
        alert(result.error || 'Failed to delete user');
      }
    }
  };

  const handleBanUser = async (userId: string) => {
    const result = await userService.updateUserStatus(userId, 'suspended');
    if (result.success) {
      // User status will be updated via Firebase subscription
      alert('User banned successfully');
    } else {
      alert(result.error || 'Failed to ban user');
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async (updatedUser: any) => {
    const roleMap: any = { 
      'User': 'viewer', 
      'Premium': 'editor', 
      'Admin': 'admin' 
    };
    const statusMap: any = {
      'Active': 'active',
      'Inactive': 'inactive', 
      'Banned': 'suspended'
    };

    const result = await userService.updateUser(updatedUser.id, {
      name: updatedUser.name,
      email: updatedUser.email,
      role: roleMap[updatedUser.role],
      status: statusMap[updatedUser.status] || 'active'
    });

    if (result.success) {
      setIsEditUserOpen(false);
      setEditingUser(null);
      alert('User updated successfully');
    } else {
      alert(result.error || 'Failed to update user');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 text-lg">
            Manage user accounts, roles, and permissions across your platform
          </p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl">
              <UserPlus className="h-5 w-5" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add New User</DialogTitle>
              <p className="text-gray-600">Create a new user account with appropriate permissions</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter user's full name" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="user@example.com" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Temporary Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Set a password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold text-gray-700">User Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-orange-200/40">
                    <SelectItem value="user">Standard User</SelectItem>
                    <SelectItem value="premium">Premium User</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;
                    const roleMap: any = { user: 'viewer', premium: 'editor', admin: 'admin' };
                    const res = await userService.createUser({
                      name: newName.trim(),
                      email: newEmail.trim(),
                      role: roleMap[newRole],
                      status: 'active',
                      password: newPassword.trim()
                    } as any);
                    if (res.success) {
                      setIsAddUserOpen(false);
                      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole('user');
                    } else {
                      // eslint-disable-next-line no-alert
                      alert(res.error || 'Failed to create user');
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  Create User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Section */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 bg-white/80"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[200px] rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 bg-white/80">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-orange-200/40">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Users</SelectItem>
                <SelectItem value="inactive">Inactive Users</SelectItem>
                <SelectItem value="banned">Banned Users</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-[200px] rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20 bg-white/80">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-orange-200/40">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Standard Users</SelectItem>
                <SelectItem value="premium">Premium Users</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-orange-200/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Users Directory ({filteredUsers.length})
              </CardTitle>
              <p className="text-gray-600 mt-1">Manage and monitor all user accounts</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {filteredUsers.filter(u => u.status === 'Active').length} Active
              </div>
              <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {filteredUsers.filter(u => u.status === 'Banned').length} Banned
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-orange-200/40 hover:bg-orange-50/30">
                  <TableHead className="py-4 px-6 font-semibold text-gray-700">User</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-gray-700">Role</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-gray-700">Joined Date</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow 
                    key={user.id} 
                    className="border-b border-orange-200/20 hover:bg-orange-50/30 transition-colors duration-200"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {user.imageUrl && <AvatarImage src={user.imageUrl} alt={user.name} />}
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold">
                            {user.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-gray-600 font-medium">
                      {new Date(user.joinedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-10 w-10 p-0 rounded-xl hover:bg-orange-50 hover:text-orange-600"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-orange-200/40 w-48">
                          <DropdownMenuItem 
                            onClick={() => handleEditUser(user)}
                            className="rounded-lg gap-3 p-3 hover:bg-orange-50 cursor-pointer"
                          >
                            <Edit className="h-4 w-4 text-orange-500" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleBanUser(user.id)}
                            className="rounded-lg gap-3 p-3 hover:bg-yellow-50 cursor-pointer text-yellow-700"
                          >
                            <Ban className="h-4 w-4" />
                            Ban User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="rounded-lg gap-3 p-3 text-red-600 hover:bg-red-50 cursor-pointer"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-orange-200/40">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit User Profile</DialogTitle>
            <p className="text-gray-600">Update user information and profile image</p>
          </DialogHeader>
          {editingUser && (
            <EditUserForm 
              user={editingUser} 
              onSave={handleUpdateUser} 
              onCancel={() => setIsEditUserOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditUserForm({ user, onSave, onCancel }: { user: any; onSave: (user: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role.toLowerCase());
  const [imageUrl, setImageUrl] = useState(user.imageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(user.imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      name,
      email,
      role: role.charAt(0).toUpperCase() + role.slice(1),
      imageUrl: imagePreview || imageUrl
    };
    onSave(updatedUser);
  };

  return (
    <div className="space-y-6">
      {/* Profile Image */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="w-24 h-24">
            {imagePreview && <AvatarImage src={imagePreview} alt={name} />}
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-2xl">
              {name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <Upload className="h-4 w-4" />
          Change Profile Picture
        </Button>
      </div>

      {/* Form Fields */}
      <div className="space-y-2">
        <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-700">Full Name</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter user's full name"
          className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-email" className="text-sm font-semibold text-gray-700">Email Address</Label>
        <Input
          id="edit-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-role" className="text-sm font-semibold text-gray-700">User Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="rounded-xl border-orange-200/60 focus:border-orange-500 focus:ring-orange-500/20">
            <SelectValue placeholder="Select user role" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-orange-200/40">
            <SelectItem value="user">Standard User</SelectItem>
            <SelectItem value="premium">Premium User</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="rounded-xl border-orange-200 text-gray-700 hover:bg-orange-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!name.trim() || !email.trim()}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}