import type { SaleDto } from "@/api/salesApi";
import type { SalesStatistics } from "@/api/salesApi";

/**
 * Exporta las ventas a formato CSV/Excel
 */
export function exportToExcel(
  sales: SaleDto[],
  statistics?: SalesStatistics
): void {
  // Crear cabecera
  const headers = [
    "Orden #",
    "Fecha",
    "Cliente",
    "Total",
    "Métodos de Pago",
    "Cantidad de Productos",
    "Estado",
  ];

  // Crear filas
  const rows = sales.map((sale) => {
    const paymentMethods = sale.payments
      .map((p) => getPaymentMethodName(p.method))
      .join(", ");

    return [
      sale.saleNumber,
      formatDateForExport(sale.date),
      sale.customerName || "Sin cliente",
      sale.total.toFixed(2),
      paymentMethods,
      sale.items.reduce((sum, item) => sum + item.quantity, 0),
      getStatusLabel(sale.status),
    ];
  });

  // Agregar estadísticas si están disponibles
  const extraRows: string[][] = [];
  if (statistics) {
    extraRows.push([]);
    extraRows.push(["RESUMEN DE ESTADÍSTICAS"]);
    extraRows.push(["Total Vendido", statistics.totalSales.toFixed(2)]);
    extraRows.push(["Transacciones", statistics.transactionCount.toString()]);
    extraRows.push(["Ticket Promedio", statistics.averageTicket.toFixed(2)]);
  }

  // Convertir a CSV
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
    ),
    ...extraRows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  // Descargar archivo
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `ventas_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta las ventas a formato PDF
 * Nota: Implementación básica usando window.print
 * Para una implementación más robusta, considerar usar jsPDF o similar
 */
export function exportToPDF(
  sales: SaleDto[],
  statistics?: SalesStatistics
): void {
  // Crear ventana de impresión
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, permite las ventanas emergentes para imprimir");
    return;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Generar HTML para imprimir
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Historial de Ventas</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #1e40af;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 10px;
        }
        .statistics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .stat-card {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #1e40af;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #1e40af;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        @media print {
          body {
            padding: 10px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <h1>Historial de Ventas</h1>
      <p>Generado el: ${formatDate(new Date().toISOString())}</p>
  `;

  // Agregar estadísticas
  if (statistics) {
    html += `
      <div class="statistics">
        <div class="stat-card">
          <div class="stat-label">Total Vendido</div>
          <div class="stat-value">${formatCurrency(statistics.totalSales)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Transacciones</div>
          <div class="stat-value">${statistics.transactionCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ticket Promedio</div>
          <div class="stat-value">${formatCurrency(
            statistics.averageTicket
          )}</div>
        </div>
      </div>
    `;
  }

  // Agregar tabla de ventas
  html += `
    <table>
      <thead>
        <tr>
          <th>Orden #</th>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Total</th>
          <th>Productos</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
  `;

  sales.forEach((sale) => {
    html += `
      <tr>
        <td><strong>${sale.saleNumber}</strong></td>
        <td>${formatDate(sale.date)}</td>
        <td>${sale.customerName || "Sin cliente"}</td>
        <td><strong>${formatCurrency(sale.total)}</strong></td>
        <td>${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
        <td>${getStatusLabel(sale.status)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <div class="footer">
      <p>Sales Management System - Reporte generado automáticamente</p>
    </div>
    <script>
      window.onload = function() {
        window.print();
        setTimeout(() => window.close(), 100);
      };
    </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// Funciones auxiliares
function getPaymentMethodName(method: number): string {
  const methods: Record<number, string> = {
    0: "Efectivo",
    1: "Tarjeta",
    2: "Voucher",
    3: "Transferencia",
    4: "Otro",
  };
  return methods[method] || "Desconocido";
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Completed: "Completada",
    Closed: "Cerrada",
    Cancelled: "Cancelada",
  };
  return labels[status] || status;
}

function formatDateForExport(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
