import { Button } from "primereact/button";

export default function ManagementActionButtons({ row, onEdit, onDelete, onView }) {
  return (
    <div className="action-buttons" style={{ display: "flex", gap: "0.25rem" }}>
      {onView && (
        <Button
          size="small"
          icon="pi pi-eye"
          text
          onClick={() => onView(row)}
          title="Ver detalles"
        />
      )}
      {!row.deleted_at && (
        <>
          {onEdit && (
            <Button
              size="small"
              icon="pi pi-pencil"
              text
              className="p-button-warning"
              onClick={() => onEdit(row)}
              title="Editar"
            />
          )}
          {onDelete && (
            <Button
              size="small"
              icon="pi pi-trash"
              text
              className="p-button-danger"
              onClick={() => onDelete(row)}
              title="Eliminar"
            />
          )}
        </>
      )}
    </div>
  );
}
