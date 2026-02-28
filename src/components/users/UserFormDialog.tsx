import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RoleDto } from "@/api/rolesApi";
import {
  createUser,
  updateUser,
  type UserCreateDto,
  type UserDto,
  type UserUpdateDto,
} from "@/api/usersApi";

interface UserFormDialogProps {
  open: boolean;
  user: UserDto | null;
  roles: RoleDto[];
  onClose: (saved: boolean) => void;
}

export function UserFormDialog({ open, user, roles, onClose }: UserFormDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = user !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setRoleId(user.roleId);
      setPassword("");
      setIsActive(user.isActive);
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setRoleId(roles.find((r) => r.isActive)?.id ?? "");
      setPassword("");
      setIsActive(true);
    }

    setError(null);
  }, [open, user, roles]);

  const isFormValid = useMemo(() => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !roleId) {
      return false;
    }

    if (!isEditing && password.trim().length < 6) {
      return false;
    }

    return true;
  }, [firstName, lastName, email, roleId, password, isEditing]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && user) {
        const dto: UserUpdateDto = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          roleId,
          isActive,
        };

        await updateUser(user.id, dto);
      } else {
        const dto: UserCreateDto = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          roleId,
          password,
          isActive,
        };

        await createUser(dto);
      }

      onClose(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el usuario"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose(false)}>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza la información y el rol del usuario."
                : "Crea un nuevo usuario dentro de este tenant."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error ? (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="user-first-name">Nombre</Label>
              <Input
                id="user-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-last-name">Apellido</Label>
              <Input
                id="user-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={320}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-role">Rol</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.isActive)
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {!isEditing ? (
              <div className="grid gap-2">
                <Label htmlFor="user-password">Contraseña</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </div>
            ) : null}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="user-is-active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="user-is-active" className="font-normal cursor-pointer">
                Usuario activo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
