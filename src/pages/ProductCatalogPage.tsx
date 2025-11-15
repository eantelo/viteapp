import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconPlus,
  IconUpload,
  IconSearch,
  IconChevronDown,
} from "@tabler/icons-react";
import type { ProductDto } from "@/api/productsApi";
import { getProducts } from "@/api/productsApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion, useReducedMotion } from "framer-motion";

export function ProductCatalogPage() {
  useDocumentTitle("Catálogo de Productos");
  const prefersReducedMotion = useReducedMotion();
  const motionInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 16 };
  const motionAnimate = { opacity: 1, y: 0 };
  const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const motionTransition = {
    duration: prefersReducedMotion ? 0 : 0.45,
    ease: prefersReducedMotion ? undefined : easing,
  };

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(2);
  const [selectedFilters, setSelectedFilters] = useState({
    category: [] as string[],
    status: [] as string[],
    supplier: [] as string[],
  });
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    status: false,
    supplier: false,
  });

  const loadProducts = async (searchTerm?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts(searchTerm);
      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar productos"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const toggleFilter = (section: "category" | "status" | "supplier") => {
    setExpandedFilters((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  const getStatusBadgeClass = (isActive: boolean, stock: number) => {
    if (!isActive) {
      return "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300";
    }
    return "px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Active" : "Draft";
  };

  // Mock data para demo (4 productos de ejemplo)
  const mockProducts = [
    {
      id: "1",
      name: "Classic Wristwatch",
      sku: "CWW-001",
      category: "Electronics",
      price: 199.99,
      stock: 120,
      isActive: true,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAsKTd-sBDsGCZ6TU1cgvUgEs-Nt3UYuFJ46AQItrtXj9d9vb0U4tMGOyXl_ACV1OntoesNp767S7ByQCLYlc5J9_-lWhNB1rl01zAvNdaSFe148_lNg-BvVuX1BoHbWTT_m0RZWtuluJkYe_1xZf5ALrcE3mBXKgL-QcbvVoMpetpQxezu7Cc0N7NmWoGXND5dNf25sBwBvFU2yL19JmCn1j-pyi_ts8Md_lefI5pvu8TTqYFLUAITyECAmjbi2liDbJbwBJmPpf8",
    },
    {
      id: "2",
      name: "Running Shoes",
      sku: "RS-204",
      category: "Apparel",
      price: 89.5,
      stock: 350,
      isActive: true,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB80GTQoolL_Xf7EAi8L0wD2-tT_hm7FFOschw7HbsWrRg-Iw1tR0nbtDPRv0sOd1TJgdOec8oWgvg5xTikK0U8MqkFfAU09LEXNxqqm5WUTZelR5lELCH1e88hpm1s0H95pfPu_zeu4dM67rPO4XlLfv5P7bczxSAN0zuWu-GCAAIHc6BieQ5wke3nbwDobSbwEWmHadVLVI9LfLS0sPtpi3W7HbAtQgTqGZHrX5tRPNnQLw9qgcJV9abyuDBz9enDg4qpUr4xI-M",
    },
    {
      id: "3",
      name: "Wireless Headphones",
      sku: "WH-335",
      category: "Electronics",
      price: 149.0,
      stock: 8,
      isActive: true,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA7WhGO-_DrBC9jRVifxTIFweFkivUaGtBudMyhNRQcTcEcmmG0avlEUjHIq9k-8ykPeNf3wn1OGL_CkmUIJOf0pv3sy61FOO9dQrlE3cvn0jkmLaMgm_9kJUuPg2bjz9IEh02PiFfx1RsbJ5NkWqIyu31_t5MbimeYkIYIgkzEfGImy9gpSlAjT8eua1kiLP3lDSavVIwuN9JKCdbSmW28dBZ2GJ_i9p820sV31HS1zBuPMi9etHkHeta7LIEXIoT16rCPLo9_cjo",
    },
    {
      id: "4",
      name: "Design Thinking Handbook",
      sku: "BK-DTH-12",
      category: "Books",
      price: 24.95,
      stock: 0,
      isActive: false,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA91uPBPkOfoxWfvfYPtyxjxTYCv-ek6ZFHWkC3wRmpHchbUjC1aKdOFQh8lIxrLFBHdYJXAIoZbTDSSraSNLWKEloNRhFPypTFj_X8hM_cV5VKcREzZZXEcJoFeduVGTGnG_edtofRioDcwroGRcYWcLpwOh9GlSQRNHljem96PiFGWo6aEzwdhhrvyoP_3e5aUgqcAaOuiAxzLLVDNuA3Pc9C0zfyPxQUS7UeC4W6_po3zPRqCaZBRp73YrkYoeR_TYK_OwJIrHI",
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Catálogo de Productos" },
        ]}
        className="flex flex-1 flex-col gap-4 p-8"
      >
        {/* Page Heading */}
        <motion.header
          className="flex flex-wrap justify-between items-center gap-4 pb-6"
          initial={motionInitial}
          animate={motionAnimate}
          transition={motionTransition}
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight">
              Product Catalog
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
              Manage your products, update details, and track inventory.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <IconUpload size={18} />
              <span>Import</span>
            </Button>
            <Button className="flex items-center gap-2">
              <IconPlus size={18} />
              <span>Add New Product</span>
            </Button>
          </div>
        </motion.header>

        <motion.div
          className="flex gap-8 mt-4"
          initial={motionInitial}
          animate={motionAnimate}
          transition={{
            ...motionTransition,
            delay: prefersReducedMotion ? 0 : 0.08,
          }}
        >
          {/* Filters Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              {/* Search Bar */}
              <div className="pb-3">
                <label className="flex flex-col min-w-40 h-11 w-full">
                  <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                    <div className="text-slate-500 dark:text-slate-400 flex bg-slate-100 dark:bg-slate-800 items-center justify-center pl-3 rounded-l-lg border-r-0">
                      <IconSearch size={20} />
                    </div>
                    <Input
                      className="rounded-l-none border-l-0 bg-slate-100 dark:bg-slate-800 h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Search products..."
                      value={search}
                      onChange={handleSearchChange}
                    />
                  </div>
                </label>
              </div>

              {/* Filter Accordions */}
              <div className="flex flex-col">
                {/* Category Filter */}
                <details
                  className="flex flex-col border-t border-t-slate-200 dark:border-t-slate-700 py-2 group"
                  open={expandedFilters.category}
                >
                  <summary
                    className="flex cursor-pointer items-center justify-between gap-6 py-2 list-none"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFilter("category");
                    }}
                  >
                    <p className="text-gray-800 dark:text-slate-200 text-sm font-medium leading-normal">
                      Category
                    </p>
                    <IconChevronDown
                      size={20}
                      className={`text-gray-600 dark:text-slate-400 transition-transform ${
                        expandedFilters.category ? "rotate-180" : ""
                      }`}
                    />
                  </summary>
                  {expandedFilters.category && (
                    <div className="flex flex-col gap-2 pt-2 text-slate-600 dark:text-slate-400 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="form-checkbox rounded text-primary focus:ring-primary/50"
                          type="checkbox"
                        />
                        <span>Electronics</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="form-checkbox rounded text-primary focus:ring-primary/50"
                          type="checkbox"
                        />
                        <span>Apparel</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="form-checkbox rounded text-primary focus:ring-primary/50"
                          type="checkbox"
                        />
                        <span>Books</span>
                      </label>
                    </div>
                  )}
                </details>

                {/* Status Filter */}
                <details
                  className="flex flex-col border-t border-t-slate-200 dark:border-t-slate-700 py-2 group"
                  open={expandedFilters.status}
                >
                  <summary
                    className="flex cursor-pointer items-center justify-between gap-6 py-2 list-none"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFilter("status");
                    }}
                  >
                    <p className="text-gray-800 dark:text-slate-200 text-sm font-medium leading-normal">
                      Status
                    </p>
                    <IconChevronDown
                      size={20}
                      className={`text-gray-600 dark:text-slate-400 transition-transform ${
                        expandedFilters.status ? "rotate-180" : ""
                      }`}
                    />
                  </summary>
                  {expandedFilters.status && (
                    <div className="flex flex-col gap-2 pt-2 text-slate-600 dark:text-slate-400 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="form-checkbox rounded text-primary focus:ring-primary/50"
                          type="checkbox"
                        />
                        <span>Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="form-checkbox rounded text-primary focus:ring-primary/50"
                          type="checkbox"
                        />
                        <span>Draft</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="form-checkbox rounded text-primary focus:ring-primary/50"
                          type="checkbox"
                        />
                        <span>Archived</span>
                      </label>
                    </div>
                  )}
                </details>

                {/* Supplier Filter */}
                <details
                  className="flex flex-col border-t border-t-slate-200 dark:border-t-slate-700 py-2 group"
                  open={expandedFilters.supplier}
                >
                  <summary
                    className="flex cursor-pointer items-center justify-between gap-6 py-2 list-none"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFilter("supplier");
                    }}
                  >
                    <p className="text-gray-800 dark:text-slate-200 text-sm font-medium leading-normal">
                      Supplier
                    </p>
                    <IconChevronDown
                      size={20}
                      className={`text-gray-600 dark:text-slate-400 transition-transform ${
                        expandedFilters.supplier ? "rotate-180" : ""
                      }`}
                    />
                  </summary>
                  {expandedFilters.supplier && (
                    <div className="flex flex-col gap-2 pt-2 text-slate-600 dark:text-slate-400 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="form-checkbox rounded text-primary focus:ring-primary/50"
                          type="checkbox"
                        />
                        <span>Tech Supplies Co.</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="form-checkbox rounded text-primary focus:ring-primary/50"
                          type="checkbox"
                        />
                        <span>Fashion Forward</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="form-checkbox rounded text-primary focus:ring-primary/50"
                          type="checkbox"
                        />
                        <span>Global Imports</span>
                      </label>
                    </div>
                  )}
                </details>
              </div>

              {/* Clear Filters Button */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                <Button
                  variant="ghost"
                  className="w-full text-primary hover:bg-primary/10"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Product Table */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">{error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                      <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th scope="col" className="p-4">
                            <input
                              className="form-checkbox rounded text-primary focus:ring-primary/50 cursor-pointer"
                              type="checkbox"
                            />
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Product
                          </th>
                          <th scope="col" className="px-6 py-3">
                            SKU
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Stock
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="bg-white dark:bg-slate-900 border-b dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="p-4">
                              <input
                                className="form-checkbox rounded text-primary focus:ring-primary/50 cursor-pointer"
                                type="checkbox"
                              />
                            </td>
                            <th
                              scope="row"
                              className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-md bg-cover bg-center flex-shrink-0"
                                  style={{
                                    backgroundImage: `url('${product.image}')`,
                                  }}
                                />
                                <div>
                                  <p>{product.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {product.category}
                                  </p>
                                </div>
                              </div>
                            </th>
                            <td className="px-6 py-4">{product.sku}</td>
                            <td className="px-6 py-4">
                              {formatPrice(product.price)}
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                product.stock <= 10 && product.stock > 0
                                  ? "text-orange-600 dark:text-orange-400"
                                  : ""
                              }`}
                            >
                              {product.stock} units
                              {product.stock <= 10 && product.stock > 0 && (
                                <span className="ml-1">(Low)</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={getStatusBadgeClass(
                                  product.isActive,
                                  product.stock
                                )}
                              >
                                {getStatusText(product.isActive)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <svg
                                  className="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <nav
                    aria-label="Table navigation"
                    className="flex items-center justify-between p-4"
                  >
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                      Showing{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        1-4
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        100
                      </span>
                    </span>
                    <ul className="inline-flex -space-x-px text-sm h-8">
                      <li>
                        <button className="flex items-center justify-center px-3 h-8 ml-0 leading-tight text-slate-500 bg-white border border-slate-300 rounded-l-lg hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                          Previous
                        </button>
                      </li>
                      <li>
                        <button className="flex items-center justify-center px-3 h-8 leading-tight text-slate-500 bg-white border border-slate-300 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                          1
                        </button>
                      </li>
                      <li>
                        <button
                          aria-current="page"
                          className="flex items-center justify-center px-3 h-8 text-primary border border-slate-300 bg-primary/10 hover:bg-primary/20 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-700 dark:text-white"
                        >
                          2
                        </button>
                      </li>
                      <li>
                        <button className="flex items-center justify-center px-3 h-8 leading-tight text-slate-500 bg-white border border-slate-300 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                          3
                        </button>
                      </li>
                      <li>
                        <button className="flex items-center justify-center px-3 h-8 leading-tight text-slate-500 bg-white border border-slate-300 rounded-r-lg hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </DashboardLayout>
    </PageTransition>
  );
}
