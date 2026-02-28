import { useEffect, useState } from "react";
import { getCategories, deleteCategory } from "@/api/categoriesApi";
import type { CategoryDto } from "@/api/categoriesApi";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader, SearchInput } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, PencilSimple, Trash, WarningCircle, Tag, SpinnerGap } from "@phosphor-icons/react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

export function CategoriesPage() {
  useDocumentTitle("Categorías");
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryDto[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(
    null
  );
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar las categorías."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Filter categories based on search
  useEffect(() => {
    const filtered = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.description.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories, search]);

  const handleCreateClick = () => {
    setSelectedCategory(null);
    setShowFormDialog(true);
  };

  const handleEditClick = (category: CategoryDto) => {
    setSelectedCategory(category);
    setShowFormDialog(true);
  };

  const handleDeleteClick = (category: CategoryDto) => {
    setSelectedCategory(category);
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    setDeletingCategory(true);
    setDeleteError(null);
    try {
      await deleteCategory(selectedCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== selectedCategory.id));
      setShowDeleteDialog(false);
      setSelectedCategory(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Error al eliminar la categoría."
      );
    } finally {
      setDeletingCategory(false);
    }
  };

  const handleFormSuccess = () => {
    // Reload categories after successful create/update
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Error reloading categories:", err);
      }
    };
    loadCategories();
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Categorías" },
        ]}
        className={PAGE_LAYOUT_CLASS}
      >
        <PageHeader
          title="Categorías"
          description="Gestiona las categorías de productos"
          icon={Tag}
          actions={
            <Button onClick={handleCreateClick} className="gap-2">
              <Plus size={18} weight="bold" />
              Nueva Categoría
            </Button>
          }
        />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o descripción..."
          resultCount={filteredCategories.length}
          totalCount={categories.length}
        />

        {/* Error message */}
        {error && (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <WarningCircle size={20} weight="bold" className="shrink-0 text-destructive" />
            <div>
              <h3 className="font-semibold text-foreground">Error</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <SpinnerGap size={32} weight="bold" className="animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Cargando categorías...</p>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Tag size={24} weight="duotone" />
            </span>
            <p className="text-sm text-muted-foreground">
              {search
                ? "No se encontraron categorías que coincidan con tu búsqueda."
                : "No hay categorías disponibles."}
            </p>
            {!search && (
              <Button onClick={handleCreateClick} variant="outline" size="sm" className="mt-2">
                Crear la primera categoría
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Descripción
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-center">
                    Estado
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground max-w-xs truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {category.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(category)}
                          className="gap-1"
                        >
                          <PencilSimple size={16} weight="bold" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(category)}
                          className="gap-1"
                        >
                          <Trash size={16} weight="bold" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Category form dialog */}
        <CategoryFormDialog
          open={showFormDialog}
          category={selectedCategory}
          onClose={() => {
            setShowFormDialog(false);
            setSelectedCategory(null);
          }}
          onSuccess={handleFormSuccess}
        />

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteError ? (
                  <div className="text-destructive mt-2">{deleteError}</div>
                ) : (
                  <>
                    ¿Estás seguro de que deseas eliminar la categoría "
                    {selectedCategory?.name}"? Esta acción no se puede deshacer.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingCategory}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deletingCategory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingCategory ? (
                  <>
                    <SpinnerGap size={16} weight="bold" className="animate-spin mr-2" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </PageTransition>
  );
}
