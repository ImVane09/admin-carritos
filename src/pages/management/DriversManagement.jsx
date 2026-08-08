import { useEffect, useMemo, useState } from "react";
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import CustomDataTable from "../../components/ui/CustomDataTable";
import ManagementActionButtons from "../../components/management/ManagementActionButtons";
import DriverModals from "../../components/management/DriverModals";
import {
  fetchUsers,
  createUserDriver,
  updateUser,
  deleteUser,
  toggleUserStatus,
  restoreUser,
} from "../../services/adminService";
import { ProgressSpinner } from "primereact/progressspinner";
import { useRef } from "react";
import StatCardPremium from "../../components/StatCardPremium";

export default function DriversManagement() {
  const toast = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [creating, setCreating] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalStats, setGlobalStats] = useState({ inactive: 0, deleted: 0 });
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    is_active: true,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchUsers({
          per_page: 10,
          page,
          search: debouncedQuery,
          role_name: "conductor",
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
        console.error("Error al cargar conductores:", err);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar los conductores desde el servidor.",
        });
        setUsers([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };
    load();
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

  const ratingBody = (row) => {
    const rating = row.rating || 4.5;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>{rating.toFixed(1)}</span>
        <div style={{ color: "#ff9800" }}>
          {"⭐".repeat(Math.floor(rating))}
        </div>
      </div>
    );
  };

  const handleEdit = (row) => {
    setEditing(row.id);
    setEditForm({ ...row, password: "" });
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

    setLoading(true);
    try {
      // 1. Guardar cambios en el backend
      const payload = {
        name: editForm.name,
        email: editForm.email,
      };
      if (editForm.password?.trim()) {
        payload.password = editForm.password.trim();
      }
      const response = await updateUser(editForm.id, payload);

      // 2. Si el estado "activo" cambió, ejecutar el toggle
      const original = users.find((u) => u.id === editForm.id);
      let activeState = !!editForm.is_active;
      if (original && !!original.is_active !== !!editForm.is_active) {
        const toggleRes = await toggleUserStatus(editForm.id);
        if (toggleRes && toggleRes.user) {
          activeState = !!toggleRes.user.is_active;
        }
      }

      const merged = {
        ...editForm,
        ...response.user,
        is_active: activeState,
      };

      if (statusFilter === "active" && !activeState) {
        setUsers(users.filter((u) => u.id !== editForm.id));
        setTotalRecords((prev) => prev - 1);
      } else if (statusFilter === "inactive" && activeState) {
        setUsers(users.filter((u) => u.id !== editForm.id));
        setTotalRecords((prev) => prev - 1);
      } else {
        setUsers(users.map((u) => (u.id === editForm.id ? merged : u)));
      }
      setEditing(null);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Conductor actualizado correctamente",
      });
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error al actualizar",
        detail: err.response?.data?.error || "Error en el servidor",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (row) => {
    setDeleteConfirm(row.id);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await deleteUser(deleteConfirm);
      if (statusFilter === "active" || statusFilter === "inactive") {
        setUsers(users.filter((u) => u.id !== deleteConfirm));
        setTotalRecords((prev) => prev - 1);
      } else {
        setUsers(
          users.map((u) =>
            u.id === deleteConfirm
              ? { ...u, deleted_at: new Date().toISOString() }
              : u,
          ),
        );
      }
      setDeleteConfirm(null);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Conductor eliminado correctamente",
      });
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.error || "No se pudo eliminar al conductor",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (row) => {
    setLoading(true);
    try {
      await restoreUser(row.id);
      if (statusFilter === "deleted") {
        setUsers(users.filter((u) => u.id !== row.id));
        setTotalRecords((prev) => prev - 1);
      } else {
        setUsers(
          users.map((u) => (u.id === row.id ? { ...u, deleted_at: null } : u)),
        );
      }
      toast.current?.show({
        severity: "success",
        summary: "Restaurado",
        detail: "Conductor restaurado correctamente",
      });
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.error || "No se pudo restaurar al conductor",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCreating(true);
    setCreateForm({ name: "", email: "", password: "", is_active: true });
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

    setLoading(true);
    try {
      const response = await createUserDriver({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
      });

      const merged = {
        ...response,
        created_at: new Date().toISOString(),
      };

      setUsers([...users, merged]);
      setCreating(false);
      toast.current?.show({
        severity: "success",
        summary: "Creado",
        detail: "Conductor creado correctamente",
      });
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Error al crear",
        detail:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Error del servidor",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

    <div className="management-section">
      <ManagementPageHeader
        title="Conductores"
        subtitle="Gestión de cuentas de conductores"
        icon="pi pi-id-card"
        buttonLabel="Nuevo Conductor"
        onButtonClick={handleCreate}
      />

      <div className="dashboard-grid-premium">
        <StatCardPremium
          title="Total Conductores"
          value={globalStats.total}
          icon="pi pi-users"
          tone="blue"
          subtitle="Registrados en sistema"
          loading={loading}
        /><StatCardPremium
          title="Inactivos / Suspendidos"
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
        />  </div>

      <CustomDataTable
          value={users}
          columns={[
            { field: "name", header: "Nombre" },
            { field: "email", header: "Correo" },
            { header: "Calificación", body: ratingBody },
            { header: "Estado", body: statusBody },
            { header: "Acciones", body: (row) => <ManagementActionButtons row={row} onEdit={handleEdit} onDelete={handleDelete} onView={setSelected} /> }
          ]}
          loading={loading}
          page={page}
          totalRecords={totalRecords}
          onPageChange={setPage}
          title={`Lista de Conductores (${totalRecords})`}
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

        <DriverModals
          selected={selected}
          setSelected={setSelected}
          editing={editing}
          setEditing={setEditing}
          editForm={editForm}
          setEditForm={setEditForm}
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          creating={creating}
          setCreating={setCreating}
          createForm={createForm}
          setCreateForm={setCreateForm}
          handleSave={handleSave}
          confirmDelete={confirmDelete}
          handleCreateSave={handleCreateSave}
        />
      </div>
    </>
  );
}
