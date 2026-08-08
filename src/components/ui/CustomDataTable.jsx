import { useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

/**
 * CustomDataTable Wrapper
 * @param {Array} value - Datos a mostrar
 * @param {Array} columns - Configuración de columnas: [{field, header, body}]
 * @param {boolean} loading - Estado de carga
 * @param {number} page - Página actual (1-indexed)
 * @param {number} totalRecords - Total de registros
 * @param {number} rows - Filas por página
 * @param {function} onPageChange - Callback al cambiar página (recibe page 1-indexed)
 * @param {string} title - Título de la tabla
 * @param {string} globalFilter - Valor de búsqueda
 * @param {function} setGlobalFilter - Setter para búsqueda
 * @param {boolean} lazy - Si es lazy load
 * @param {ReactNode} headerElements - Elementos extra a la izquierda del buscador
 */
export default function CustomDataTable({
  value,
  columns,
  loading,
  page,
  totalRecords,
  rows = 10,
  onPageChange,
  title = "Detalles",
  globalFilter,
  setGlobalFilter,
  lazy = true,
  searchPlaceholder = "Buscar...",
  headerElements = null,
  onExport = null,
  showExport = false
}) {
  const dt = useRef(null);

  const exportExcel = () => {
    if (onExport) {
      onExport();
    } else if (dt.current) {
      dt.current.exportCSV();
    }
  };

  return (
    <Card className="management-table">
      <div className="management-toolbar">
        <h3>{title}</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {headerElements}
          {setGlobalFilter && (
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </span>
          )}
          {showExport && (
            <Button
              type="button"
              icon="pi pi-file-excel"
              severity="success"
              rounded
              onClick={exportExcel}
              data-pr-tooltip="Exportar Excel"
            />
          )}
        </div>
      </div>
      <DataTable
        ref={dt}
        value={value}
        lazy={lazy}
        paginator
        first={(page - 1) * rows}
        rows={rows}
        totalRecords={totalRecords}
        onPage={(e) => onPageChange && onPageChange(e.page + 1)}
        loading={loading}
        responsiveLayout="scroll"
        emptyMessage="No se encontraron registros."
      >
        {columns.map((col, i) => (
          <Column
            key={i}
            field={col.field}
            header={col.header}
            body={col.body}
          />
        ))}
      </DataTable>
    </Card>
  );
}
