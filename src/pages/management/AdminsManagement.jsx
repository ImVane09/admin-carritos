import { useEffect, useMemo, useState, useRef } from "react";
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { DetailModal, DetailField } from "../../components/ui/DetailModal";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import {
  fetchUsers,
  createUserAdmin,
  updateUser,
  deleteUser,
  toggleUserStatus,
  restoreUser,
} from "../../services/adminService";
import { ProgressSpinner } from "primereact/progressspinner";
import StatCardPremium from "../../components/StatCardPremium";
import CustomDataTable from "../../components/ui/CustomDataTable";
import ManagementActionButtons from "../../components/management/ManagementActionButtons";

const PERMISSIONS_LIST = [
  { id: 1, name: "view_dashboard", label: "Ver Dashboard" },
  { id: 2, name: "view_driver_reports", label: "Ver Reportes de Conductores" },
  { id: 3, name: "view_route_reports", label: "Ver Reportes de Rutas" },
  { id: 4, name: "view_passenger_reports", label: "Ver Reportes de Pasajeros" },
  { id: 5, name: "manage_users", label: "Gestionar Usuarios" },
  { id: 6, name: "manage_admins", label: "Gestionar Administradores" },
  { id: 7, name: "manage_vehicles", label: "Gestionar Vehículos" },
  { id: 8, name: "manage_destinations", label: "Gestionar Destinos" },
  { id: 9, name: "view_history", label: "Ver Historial de Viajes" },
  { id: 10, name: "manage_shifts", label: "Gestionar Horarios" },
  { id: 11, name: "manage_assignments", label: "Gestionar Asignaciones" },
  { id: 12, name: "manage_events", label: "Gestionar Eventos" },
  { id: 13, name: "manage_disconnects", label: "Gestionar Desconexiones" },
];

export default function AdminsManagement() {
  const toast = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    is_active: true,
    permissions: [],
  });

  const onPermissionChange = (e, formState, setFormState) => {
    let selectedPermissions = [...formState.permissions];
    if (e.checked) {
      selectedPermissions.push(e.value);
    } else {
      selectedPermissions = selectedPermissions.filter(
        (val) => val !== e.value,
      );
    }
    setFormState({ ...formState, permissions: selectedPermissions });
  };

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalStats, setGlobalStats] = useState({ inactive: 0, deleted: 0 });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async (pageNumber = page) => {
    setLoading(true);
    try {
      const result = await fetchUsers({
        per_page: 10,
        page: pageNumber,
        search: debouncedQuery,
        role_id: 1,
        status: statusFilter,
      });
      setUsers(result?.data || []);
      setTotalRecords(result?.total || 0);
      if (result?.total_inactivos !== undefined) {
        setGlobalStats({
          inactive: result.total_inactivos || 0,
          deleted: result.total_eliminados || 0,
          total: result.total_registrados || 0,
        });
      }
    } catch (err) {
      console.error("Error al cargar administradores:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          "No se pudieron cargar los administradores desde el servidor.",
      });
      setUsers([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page);
  }, [page, debouncedQuery, statusFilter]);

  const statusBody = (row) => {
    if (row.deleted_at) {
      return (
        <span
          className="status-badge status-inactivo"
          style={{ backgroundColor: "#e57373", color: "#fff" }}
        >
          Eliminado
        </span>
      );
    }
    return (
      <span
        className={`status-badge status-${row.is_active ? "activo" : "inactivo"}`}
      >
        {row.is_active ? "Activo" : "Inactivo"}
      </span>
    );
  };

  const handleEdit = (row) => {
    setEditing(row.id);
    const userPerms = row.permissions || [];
    // Convert names to IDs
    const permIds = PERMISSIONS_LIST.filter((p) =>
      userPerms.includes(p.name),
    ).map((p) => p.id);
    setEditForm({ ...row, password: "", permissions: permIds });
  };

  const handleSave = async () => {
    if (!editForm.name?.trim() || !editForm.email?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Datos incompletos",
        detail: "Por favor, rellena nombre y correo.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        permissions: editForm.permissions || [],
      };
      if (editForm.password?.trim()) {
        payload.password = editForm.password.trim();
      }
      await updateUser(editForm.id, payload);

      const original = users.find((u) => u.id === editForm.id);
      if (original && !!original.is_active !== !!editForm.is_active) {
        await toggleUserStatus(editForm.id);
      }

      setEditing(null);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Administrador actualizado correctamente",
      });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error al actualizar",
        detail: err.response?.data?.error || "Error en el servidor",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (row) => {
    setDeleteConfirm(row.id);
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteUser(deleteConfirm);
      setDeleteConfirm(null);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Administrador eliminado correctamente",
      });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.error || "No se pudo eliminar al administrador",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (row) => {
    setIsSubmitting(true);
    try {
      await restoreUser(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Restaurado",
        detail: "Administrador restaurado correctamente",
      });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.error || "No se pudo restaurar al administrador",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = () => {
    setCreating(true);
    setCreateForm({
      name: "",
      email: "",
      password: "",
      is_active: true,
      permissions: [],
    });
  };

  const handleCreateSave = async () => {
    if (
      !createForm.name?.trim() ||
      !createForm.email?.trim() ||
      !createForm.password?.trim()
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Datos incompletos",
        detail: "Por favor complete nombre, correo y contraseña.",
      });
      return;
    }
    if (createForm.password.length < 8) {
      toast.current?.show({
        severity: "warn",
        summary: "Contraseña muy corta",
        detail: "La contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createUserAdmin({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password.trim(),
        permissions: createForm.permissions || [],
      });

      setCreating(false);
      toast.current?.show({
        severity: "success",
        summary: "Creado",
        detail: "Administrador creado correctamente",
      });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error al crear",
        detail: err.response?.data?.error || "Error en el servidor",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      <div className="management-section">
        <ManagementPageHeader
          title="Administradores"
          subtitle="Gestión de cuentas administrativas del sistema"
          icon="pi pi-shield"
          buttonLabel="Nuevo Admin"
          onButtonClick={handleCreate}
        />

        <div className="dashboard-grid-premium">
          <StatCardPremium
            title="Total Administradores"
            value={globalStats.total}
            icon="pi pi-shield"
            tone="blue"
            subtitle="Registrados en sistema"
            loading={loading}
          />
          <StatCardPremium
            title="Inactivos"
            value={globalStats.inactive}
            icon="pi pi-user-minus"
            tone="amber"
            subtitle="En el sistema"
            loading={loading}
          />
          <StatCardPremium
            title="Eliminados"
            value={globalStats.deleted}
            icon="pi pi-trash"
            tone="red"
            subtitle="En el sistema"
            loading={loading}
          />
        </div>

        <CustomDataTable
          value={users}
          columns={[
            { field: "name", header: "Nombre" },
            { field: "email", header: "Correo" },
            { header: "Estado", body: statusBody },
            { header: "Acciones", body: (row) => <ManagementActionButtons row={row} onEdit={handleEdit} onDelete={handleDelete} onView={setSelected} /> }
          ]}
          loading={loading}
          page={page}
          totalRecords={totalRecords}
          onPageChange={setPage}
          title={`Lista de Administradores (${totalRecords})`}
          globalFilter={query}
          setGlobalFilter={setQuery}
          searchPlaceholder="Buscar por nombre o correo"
          headerElements={
            <Dropdown
              value={statusFilter}
              options={[
                { label: "Todos", value: "all" },
                { label: "Activos", value: "active" },
                { label: "Inactivos", value: "inactive" },
                { label: "Eliminados", value: "deleted" },
              ]}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => {
                setStatusFilter(e.value);
                setPage(1);
              }}
              placeholder="Filtrar por estado"
            />
          }
        />

        <DetailModal
          header="Detalles del Administrador"
          visible={!!selected}
          onHide={() => setSelected(null)}
          icon={selected?.name?.slice(0, 1).toUpperCase()}
          title={selected?.name}
          subtitle={`ID de Administrador: #${selected?.id}`}
        >
          {selected && (
            <>
              <DetailField icon="pi pi-envelope" label="Correo Electrónico">
                {selected.email}
              </DetailField>
              <DetailField icon="pi pi-shield" label="Rol">
                <span className="role-badge role-admin" style={{ margin: 0 }}>
                  <i className="pi pi-shield" style={{ marginRight: "0.25rem" }} /> Administrador
                </span>
              </DetailField>
              <DetailField icon="pi pi-check-circle" label="Estado de cuenta">
                {selected.deleted_at ? (
                  <span className="status-badge status-inactivo" style={{ backgroundColor: "#e57373", color: "#fff" }}>
                    Eliminado
                  </span>
                ) : selected.is_active ? (
                  <span className="status-badge status-activo">Activo</span>
                ) : (
                  <span className="status-badge status-inactivo">Inactivo</span>
                )}
              </DetailField>
              <DetailField icon="pi pi-calendar" label="Fecha de Registro">
                {new Date(selected.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </DetailField>
            </>
          )}
        </DetailModal>

        <Dialog blockScroll
          header="Editar Administrador"
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

              <div className="col-12 mt-2 pt-3 border-top-1 border-300">
                <label className="font-bold block mb-2">
                  Permisos Especiales
                </label>
                <div className="flex flex-column gap-2">
                  {PERMISSIONS_LIST.map((permission) => (
                    <div
                      key={permission.id}
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <Checkbox
                        inputId={`perm-${permission.id}`}
                        name="permission"
                        value={permission.id}
                        onChange={(e) =>
                          onPermissionChange(e, editForm, setEditForm)
                        }
                        checked={editForm.permissions?.includes(permission.id)}
                      />
                      <label
                        htmlFor={`perm-${permission.id}`}
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                        }}
                      >
                        {permission.label}
                      </label>
                    </div>
                  ))}
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
              ¿Está seguro que desea suspender a este administrador? Podrá
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
          header="Crear Nuevo Administrador"
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

            <div className="col-12 mt-2 pt-3 border-top-1 border-300">
              <label className="font-bold block mb-2">
                Permisos Especiales
              </label>
              <div className="flex flex-column gap-2">
                {PERMISSIONS_LIST.map((permission) => (
                  <div
                    key={permission.id}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <Checkbox
                      inputId={`cperm-${permission.id}`}
                      name="permission"
                      value={permission.id}
                      onChange={(e) =>
                        onPermissionChange(e, createForm, setCreateForm)
                      }
                      checked={createForm.permissions?.includes(permission.id)}
                    />
                    <label
                      htmlFor={`cperm-${permission.id}`}
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                      }}
                    >
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="premium-modal-footer">
            <Button
              label="Cancelar"
              onClick={() => setCreating(false)}
              className="p-button-text"
            />
            <Button
              label="Crear"
              onClick={handleCreateSave}
              className="p-button-primary"
              loading={isSubmitting}
            />
          </div>
        </Dialog>
      </div>
    </>
  );
}
