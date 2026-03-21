import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
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
  PencilSimple,
  Plus,
  Power,
  Key,
  Users,
  SpinnerGap,
} from "@phosphor-icons/react";
import { ConfirmDialog, PageHeader, SearchInput } from "@/components/shared";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";
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
  const [userToToggle, setUserToToggle] = useState<UserDto | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

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
    setUserToToggle(user);
  };

  const confirmToggleActive = async () => {
    if (!userToToggle) {
      return;
    }

    const actionLabel = userToToggle.isActive ? "desactivar" : "activar";
    try {
      setToggleLoading(true);
      await toggleUserActive(userToToggle.id);
      toast.success(`Usuario ${actionLabel}do correctamente`);
      setUserToToggle(null);
      await loadData();
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error
          ? toggleError.message
          : "No se pudo actualizar el estado del usuario"
      );
    } finally {
      setToggleLoading(false);
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
        className={PAGE_LAYOUT_CLASS}
      >
        <div className="w-full max-w-[1320px] space-y-4">
          <PageHeader
            icon={Users}
            title="Usuarios"
            description="Administración de usuarios, roles y estado de acceso."
            actions={
              canManage ? (
                <Button onClick={handleCreate} className="gap-2">
                  <Plus size={18} weight="bold" />
                  Nuevo usuario
                </Button>
              ) : null
            }
          />

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, email o rol"
            resultCount={filteredUsers.length}
            totalCount={users.length}
          />

          <div className="rounded-lg border border-border bg-card">
            <div className="grid gap-4 p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <SpinnerGap size={32} weight="bold" className="animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
                    {error}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                    No hay usuarios para mostrar.
                  </div>
                ) : (
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
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
                                  <span className="text-xs text-muted-foreground">Sin permisos</span>
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
          </div>
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

        <ConfirmDialog
          open={Boolean(userToToggle)}
          title={userToToggle?.isActive ? "Desactivar usuario" : "Activar usuario"}
          description={
            userToToggle
              ? userToToggle.isActive
                ? `Se desactivará el acceso de ${userToToggle.fullName}. Podrás reactivarlo después.`
                : `Se activará nuevamente el acceso de ${userToToggle.fullName}.`
              : ""
          }
          confirmLabel={userToToggle?.isActive ? "Desactivar usuario" : "Activar usuario"}
          cancelLabel="Volver"
          tone={userToToggle?.isActive ? "destructive" : "default"}
          isLoading={toggleLoading}
          onConfirm={() => void confirmToggleActive()}
          onCancel={() => {
            if (toggleLoading) return;
            setUserToToggle(null);
          }}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
