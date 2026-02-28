import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Power,
  Key,
} from "@phosphor-icons/react";
import {
  getUsers,
  resetUserPassword,
  toggleUserActive,
  type UserDto,
} from "@/api/usersApi";
import { getRoles, type RoleDto } from "@/api/rolesApi";

export function UsersPage() {
  useDocumentTitle("Usuarios");

  const { hasPermission } = useAuth();
  const canManage = hasPermission("Users.Manage");

  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) {
      return users;
    }

    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      return (
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.roleName.toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los usuarios"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: UserDto) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleToggleActive = async (user: UserDto) => {
    if (!canManage) {
      return;
    }

    const actionLabel = user.isActive ? "desactivar" : "activar";
    if (!confirm(`¿Deseas ${actionLabel} al usuario ${user.fullName}?`)) {
      return;
    }

    try {
      await toggleUserActive(user.id);
      toast.success(`Usuario ${actionLabel}do correctamente`);
      await loadData();
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error
          ? toggleError.message
          : "No se pudo actualizar el estado del usuario"
      );
    }
  };

  const handleResetPassword = async (user: UserDto) => {
    if (!canManage) {
      return;
    }

    const newPassword = window.prompt(
      `Nueva contraseña para ${user.fullName} (mínimo 6 caracteres):`
    );

    if (!newPassword) {
      return;
    }

    if (newPassword.trim().length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      await resetUserPassword(user.id, { newPassword });
      toast.success("Contraseña restablecida correctamente");
    } catch (resetError) {
      toast.error(
        resetError instanceof Error
          ? resetError.message
          : "No se pudo restablecer la contraseña"
      );
    }
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Usuarios" },
        ]}
        className="flex flex-1 flex-col gap-3 p-3 md:p-4 lg:p-6"
      >
        <div className="w-full max-w-[1320px]">
          <header className="flex items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Usuarios
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Administración de usuarios, roles y estado de acceso.
              </p>
            </div>
            {canManage ? (
              <Button onClick={handleCreate} className="gap-2 h-fit">
                <Plus size={18} weight="bold" />
                Nuevo usuario
              </Button>
            ) : null}
          </header>

          <Card className="border-slate-200/80 dark:border-slate-700/80 dark:bg-slate-900 shadow-none">
            <CardContent>
              <div className="grid gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                    <MagnifyingGlass size={16} weight="bold" />
                  </span>
                  <Input
                    placeholder="Buscar por nombre, email o rol"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-12"
                    aria-label="Buscar usuarios"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-primary" />
                  </div>
                ) : error ? (
                  <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-6 text-center text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No hay usuarios para mostrar.
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-800">
                        <TableRow className="dark:border-slate-700">
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} className="dark:border-slate-700">
                            <TableCell className="font-medium">{user.fullName}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{user.roleName}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? "default" : "outline"}>
                                {user.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {canManage ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleEdit(user)}
                                      aria-label={`Editar ${user.fullName}`}
                                    >
                                      <PencilSimple size={16} weight="bold" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleToggleActive(user)}
                                      aria-label={`Cambiar estado de ${user.fullName}`}
                                    >
                                      <Power size={16} weight="bold" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleResetPassword(user)}
                                      aria-label={`Reset password ${user.fullName}`}
                                    >
                                      <Key size={16} weight="bold" />
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-500">Sin permisos</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <UserFormDialog
          open={dialogOpen}
          user={editingUser}
          roles={roles}
          onClose={(saved) => {
            setDialogOpen(false);
            setEditingUser(null);
            if (saved) {
              void loadData();
            }
          }}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
