import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';

export default function DriverModals({
  selected,
  setSelected,
  editing,
  setEditing,
  editForm,
  setEditForm,
  deleteConfirm,
  setDeleteConfirm,
  creating,
  setCreating,
  createForm,
  setCreateForm,
  handleSave,
  confirmDelete,
  handleCreateSave,
  isSubmitting
}) {
  return (
    <>
      <Dialog blockScroll
        header="Detalles del Conductor"
        visible={!!selected}
        style={{ width: "30rem" }}
        onHide={() => setSelected(null)}
        dismissableMask
      >
        {selected && (
          <div className="user-detail-card" style={{ padding: "0.5rem 0" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "var(--brand-700)",
                  color: "white",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  margin: "0 auto 0.5rem auto",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}
              >
                {selected.name?.slice(0, 1).toUpperCase()}
              </div>
              <h3
                style={{
                  margin: "0.3rem 0",
                  color: "var(--brand-900)",
                  fontSize: "1.35rem",
                  fontWeight: "600",
                }}
              >
                {selected.name}
              </h3>
              <p
                style={{
                  color: "var(--ink-500)",
                  fontSize: "0.85rem",
                  margin: 0,
                }}
              >
                ID de Conductor: #{selected.id}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1rem",
                borderTop: "1px solid var(--border)",
                paddingTop: "1.2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "var(--ink-500)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i
                    className="pi pi-envelope"
                    style={{ color: "var(--brand-500)" }}
                  />{" "}
                  Correo Electrónico:
                </span>
                <strong
                  style={{
                    color: "var(--ink-900)",
                    wordBreak: "break-all",
                    marginLeft: "1rem",
                    textAlign: "right",
                  }}
                >
                  {selected.email}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "var(--ink-500)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i
                    className="pi pi-star-fill"
                    style={{ color: "#ff9800" }}
                  />{" "}
                  Calificación:
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    color: "#ff9800",
                    fontWeight: "bold",
                  }}
                >
                  {"⭐".repeat(Math.floor(parseFloat(selected.score || 5)))} (
                  {parseFloat(selected.score || 5).toFixed(1)})
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "var(--ink-500)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i
                    className="pi pi-check-circle"
                    style={{ color: "var(--brand-500)" }}
                  />{" "}
                  Estado de cuenta:
                </span>
                <span
                  className={`status-badge status-${selected.is_active ? "activo" : "inactivo"}`}
                  style={{ margin: 0 }}
                >
                  {selected.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "var(--ink-500)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i
                    className="pi pi-calendar"
                    style={{ color: "var(--brand-500)" }}
                  />{" "}
                  Fecha de Registro:
                </span>
                <strong style={{ color: "var(--ink-900)" }}>
                  {new Date(selected.created_at).toLocaleDateString("es-ES", {
                    dateStyle: "medium",
                  })}
                </strong>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "2rem",
                borderTop: "1px solid var(--border)",
                paddingTop: "1rem",
              }}
            >
              <Button
                label="Cancelar"
                onClick={() => setSelected(null)}
                className="p-button-text"
                style={{ borderRadius: "8px" }}
              />
            </div>
          </div>
        )}
      </Dialog>

      <Dialog blockScroll
        header="Editar Conductor"
        visible={!!editing}
        style={{ width: "32rem" }}
        onHide={() => setEditing(null)}
      >
        {editForm && (
          <>
          <div className="grid p-fluid">
            <div className="col-12 mb-3">
              <div className="flex flex-column gap-2">
                <label htmlFor="name" className="font-bold">
                  Nombre
                </label>
                <InputText
                  id="name"
                  value={editForm.name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="col-12 mb-3">
              <div className="flex flex-column gap-2">
                <label htmlFor="email" className="font-bold">
                  Correo
                </label>
                <InputText
                  id="email"
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="col-12 mb-3">
              <div className="flex flex-column gap-2">
                <label htmlFor="password" className="font-bold">
                  Nueva Contraseña (Opcional)
                </label>
                <InputText
                  id="password"
                  type="password"
                  value={editForm.password || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  className="w-full"
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className="flex align-items-center justify-content-between">
                <label htmlFor="is_active" className="font-bold">
                  Activo
                </label>
                <InputSwitch
                  id="is_active"
                  checked={editForm.is_active || false}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_active: e.value })
                  }
                />
              </div>
            </div>
          </div>
          <div className="premium-modal-footer">
            <Button
              label="Cancelar"
              onClick={() => setEditing(null)}
              className="p-button-text"
            />
            <Button
              label="Guardar"
              onClick={handleSave}
              className="p-button-primary"
              loading={isSubmitting}
            />
          </div>
          </>
        )}
      </Dialog>

      <Dialog blockScroll
        visible={!!deleteConfirm}
        style={{ width: "26rem", borderRadius: "16px" }}
        onHide={() => setDeleteConfirm(null)}
        showHeader={false}
      >
        <div
          style={{
            padding: "1.5rem 1rem 1rem 1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "3.25rem",
              height: "3.25rem",
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626",
              fontSize: "1.5rem",
              marginBottom: "1rem",
              boxShadow: "0 4px 10px rgba(220, 38, 38, 0.15)",
            }}
          >
            <i className="pi pi-exclamation-triangle" />
          </div>

          <h3
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#0f172a",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            ¿Confirmar suspensión?
          </h3>

          <p
            style={{
              margin: "0 0 1.5rem 0",
              fontSize: "0.9rem",
              color: "#64748b",
              lineHeight: "1.45",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            ¿Está seguro que desea suspender a este conductor? Podrá
            restaurarlo o volver a activarlo en cualquier momento más
            adelante.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
            <Button
              label="Cancelar"
              onClick={() => setDeleteConfirm(null)}
              className="p-button-text"
              style={{ flex: 1, borderRadius: "8px" }}
            />
            <Button
              label="Suspender"
              onClick={confirmDelete}
              loading={isSubmitting}
              style={{
                flex: 1,
                borderRadius: "8px",
                backgroundColor: "#dc2626",
                border: "none",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.9rem",
                padding: "0.65rem 0",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
              }}
            />
          </div>
        </div>
      </Dialog>

      <Dialog blockScroll
        header="Crear Nuevo Conductor"
        visible={creating}
        style={{ width: "32rem" }}
        onHide={() => setCreating(false)}
      >
        <div className="grid p-fluid">
          <div className="col-12 mb-3">
            <div className="flex flex-column gap-2">
              <label htmlFor="createName" className="font-bold">
                Nombre
              </label>
              <InputText
                id="createName"
                value={createForm.name || ""}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                className="w-full"
                placeholder="Nombre completo"
              />
            </div>
          </div>
          
          <div className="col-12 mb-3">
            <div className="flex flex-column gap-2">
              <label htmlFor="createEmail" className="font-bold">
                Correo
              </label>
              <InputText
                id="createEmail"
                value={createForm.email || ""}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                className="w-full"
                placeholder="correo@example.com"
              />
            </div>
          </div>
          
          <div className="col-12 mb-3">
            <div className="flex flex-column gap-2">
              <label htmlFor="createPassword" className="font-bold">
                Contraseña
              </label>
              <InputText
                id="createPassword"
                type="password"
                value={createForm.password || ""}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                className="w-full"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>

          <div className="col-12 mb-3">
            <div className="flex align-items-center justify-content-between">
              <label htmlFor="createActive" className="font-bold">
                Activo
              </label>
              <InputSwitch
                id="createActive"
                checked={createForm.is_active || false}
                onChange={(e) =>
                  setCreateForm({ ...createForm, is_active: e.value })
                }
              />
            </div>
          </div>
        </div>
        <div className="premium-modal-footer">
          <Button label="Cancelar" onClick={() => setCreating(false)} className="p-button-text" />
          <Button label="Crear" onClick={handleCreateSave} className="p-button-primary" loading={isSubmitting} />
        </div>
      </Dialog>
    </>
  );
}
