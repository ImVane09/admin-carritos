import { useEffect, useRef, useState } from "react";
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { DetailModal, DetailField } from "../../components/ui/DetailModal";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import CustomDataTable from "../../components/ui/CustomDataTable";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Toast } from "primereact/toast";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchAssignments,
} from "../../services/adminService";
import ManagementActionButtons from "../../components/management/ManagementActionButtons";
import StatCardPremium from "../../components/StatCardPremium";

const EMPTY_FORM = {
  id: null,
  name: "",
  description: "",
  start_date: null,
  end_date: null,
  is_active: true,
  assignment_ids: [],
};

export default function EventsManagement() {
  const toast = useRef(null);

  const [events, setEvents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalStats, setGlobalStats] = useState({ total: 0, active: 0, reserved: 0 });

  // Modal states
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);

  const loadData = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const eventsData = await fetchEvents({ 
        search: globalFilterValue, 
        status: statusFilter, 
        page: pageNumber, 
        per_page: 15 
      });
      setEvents(eventsData?.data || []);
      setTotalRecords(eventsData?.total || 0);
      if (eventsData?.total_registrados !== undefined) {
        setGlobalStats({
          total: eventsData.total_registrados || 0,
          active: eventsData.total_activos || 0,
          reserved: eventsData.total_conductores_reservados || 0
        });
      }
      setPage(pageNumber);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page);
  }, [page, statusFilter, globalFilterValue]);

  const loadAssignmentsIfNeeded = async () => {
    if (assignments.length === 0) {
      try {
        const assignmentsData = await fetchAssignments({
          status: "active",
          per_page: 100,
        });
        let data = [];
        if (Array.isArray(assignmentsData)) {
          data = assignmentsData;
        } else if (assignmentsData && Array.isArray(assignmentsData.data)) {
          data = assignmentsData.data;
        }
        setAssignments(data);
      } catch (err) {
        console.error("Error cargando asignaciones:", err);
      }
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreating(true);
  };

  const openEdit = async (rowData) => {
    setForm({
      id: rowData.id,
      name: rowData.name,
      description: rowData.description,
      start_date: new Date(rowData.start_date),
      end_date: new Date(rowData.end_date),
      is_active: rowData.is_active,
      assignment_ids: rowData.assignments
        ? rowData.assignments.map((a) => a.id)
        : [],
    });
    setEditing(true);
    await loadAssignmentsIfNeeded();
  };

  const openView = (rowData) => {
    setSelected(rowData);
    setViewing(true);
  };

  const handleSave = async () => {
    try {
      if (!form.name || !form.start_date || !form.end_date) {
        toast.current?.show({
          severity: "warn",
          summary: "Atención",
          detail: "Por favor, completa los campos obligatorios.",
        });
        return;
      }

      setIsSubmitting(true);

      const pad = (n) => String(n).padStart(2, "0");
      const formatLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      
      const payload = {
        name: form.name,
        description: form.description,
        start_date: formatLocal(form.start_date),
        end_date: formatLocal(form.end_date),
        is_active: form.is_active,
        assignment_ids: form.assignment_ids,
      };

      if (creating) {
        await createEvent(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Evento creado correctamente.",
        });
      } else {
        await updateEvent(form.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Evento actualizado correctamente.",
        });
      }

      setCreating(false);
      setEditing(false);
      await loadData(page);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al guardar el evento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsSubmitting(true);
    try {
      await deleteEvent(deleteConfirm.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Evento eliminado correctamente.",
      });
      setDeleteConfirm(null);
      await loadData(page);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al eliminar el evento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionsTemplate = (rowData) => (
    <ManagementActionButtons
      row={rowData}
      onEdit={openEdit}
      onDelete={setDeleteConfirm}
      onView={openView}
    />
  );

  const statusTemplate = (rowData) => {
    if (rowData.deleted_at) {
      return <span className="status-badge status-danger">Eliminado</span>;
    }

    const now = new Date();
    const start = new Date(rowData.start_date);
    const end = new Date(rowData.end_date);

    if (rowData.is_active === false || rowData.is_active === 0) {
      return <span className="status-badge status-inactivo">Inactivo</span>;
    }

    if (now < start) {
      return <span className="status-badge status-info">Futuro</span>;
    } else if (now > end) {
      return <span className="status-badge status-warning">Pasado</span>;
    }
    return <span className="status-badge status-activo">Activo</span>;
  };

  const assignmentsTemplate = (rowData) => {
    return rowData.assignments && rowData.assignments.length > 0
      ? `${rowData.assignments.length} asignacion(es)`
      : "Ninguno";
  };

  return (
    <div className="management-page">
      <Toast ref={toast} />
      <ManagementPageHeader
        title="Gestión de Eventos"
        subtitle="Definición de eventos especiales en el campus"
        icon="pi pi-ticket"
        buttonLabel="Nuevo Evento"
        onButtonClick={openCreate}
      />

      <div className="management-content">
        <div
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <StatCardPremium
            title="Total Eventos"
            value={globalStats.total}
            icon="pi pi-ticket"
            tone="blue"
            subtitle="Registrados en el sistema"
            loading={loading}
          />
          <StatCardPremium
            title="Eventos Activos"
            value={globalStats.active}
            icon="pi pi-calendar-clock"
            tone="green"
            subtitle="En curso actualmente"
            loading={loading}
          />
          <StatCardPremium
            title="Conductores Reservados"
            value={globalStats.reserved}
            icon="pi pi-car"
            tone="purple"
            subtitle="Asignados a eventos"
            loading={loading}
          />
        </div>

        <CustomDataTable
          value={events}
          loading={loading}
          dataKey="id"
          lazy={true}
          page={page}
          totalRecords={totalRecords}
          rows={15}
          onPageChange={(newPage) => setPage(newPage)}
          title="Listado de Eventos"
          globalFilter={globalFilterValue}
          setGlobalFilter={(val) => { setGlobalFilterValue(val); setPage(1); }}
          headerElements={
            <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '300px' }}>
              <Dropdown
                value={statusFilter}
                options={[
                  { label: 'Todos', value: 'all' },
                  { label: 'Activos', value: 'active' },
                  { label: 'Pasados', value: 'past' },
                  { label: 'Futuros', value: 'future' },
                  { label: 'Eliminados', value: 'deleted' }
                ]}
                onChange={(e) => {
                  setStatusFilter(e.value);
                  setPage(1);
                }}
                placeholder="Filtrar por estado"
                className="w-full"
              />
            </div>
          }
          columns={[
            { field: "name", header: "Nombre" },
            {
              header: "Inicio",
              body: (row) => new Date(row.start_date).toLocaleString("es-ES"),
            },
            {
              header: "Fin",
              body: (row) => new Date(row.end_date).toLocaleString("es-ES"),
            },
            { header: "Estado", body: statusTemplate },
            { header: "Asignaciones a cargo", body: assignmentsTemplate },
            { header: "Acciones", body: actionsTemplate },
          ]}
        />
      </div>

      <Dialog blockScroll
        header={creating ? "Nuevo Evento" : "Editar Evento"}
        visible={creating || editing}
        onHide={() => {
          setCreating(false);
          setEditing(false);
        }}
        style={{ width: "40rem" }}
        contentClassName="pt-1"
      >
        <div className="grid p-fluid">
          <div className="col-12 mb-3">
            <div className="flex flex-column gap-2">
              <label htmlFor="name" className="font-bold">
                Nombre del Evento <span className="text-red-500">*</span>
              </label>
              <InputText
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Recorrido Especial..."
              />
            </div>
          </div>

          <div className="col-12 mb-3">
            <div className="flex flex-column gap-2">
              <label htmlFor="description" className="font-bold">
                Descripción
              </label>
              <InputTextarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                placeholder="Detalles adicionales o propósito del evento..."
                autoResize
              />
            </div>
          </div>

          <div className="col-12 md:col-6 mb-3">
            <div className="flex flex-column gap-2">
              <label htmlFor="start_date" className="font-bold">
                Fecha y Hora de Inicio <span className="text-red-500">*</span>
              </label>
              <Calendar
                id="start_date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.value })}
                showTime
                hourFormat="24"
                showIcon
                placeholder="Seleccione fecha y hora"
              />
            </div>
          </div>

          <div className="col-12 md:col-6 mb-3">
            <div className="flex flex-column gap-2">
              <label htmlFor="end_date" className="font-bold">
                Fecha y Hora de Fin <span className="text-red-500">*</span>
              </label>
              <Calendar
                id="end_date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.value })}
                showTime
                hourFormat="24"
                showIcon
                placeholder="Seleccione fecha y hora"
              />
            </div>
          </div>

          <div className="col-12 mb-3">
            <div className="flex flex-column gap-2">
              <label htmlFor="assignment_ids" className="font-bold">
                Conductores Asignados
              </label>
              <MultiSelect
                id="assignment_ids"
                value={form.assignment_ids || []}
                options={(Array.isArray(assignments) ? assignments : [])
                  .filter((a) => a != null)
                  .map((a) => ({
                    label: `${a?.user?.name || "Desconocido"} (${a?.vehicle?.plate || "Sin placa"})`,
                    value: a?.id,
                  }))}
                onChange={(e) => setForm({ ...form, assignment_ids: e.value })}
                placeholder="Seleccione los conductores para este evento"
                display="chip"
                className="w-full"
                emptyMessage="No hay conductores activos disponibles"
                onShow={() => loadAssignmentsIfNeeded()}
                scrollHeight="150px"
              />
            </div>
          </div>

          <div className="col-12 flex justify-content-end align-items-center gap-3 mt-2">
            <label htmlFor="is_active" className="font-bold mb-0">
              {form.is_active ? "Evento Activo" : "Evento Inactivo"}
            </label>
            <InputSwitch
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.value })}
            />
          </div>
        </div>
        <div className="premium-modal-footer">
          <Button
            label="Cancelar"
            onClick={() => {
              setCreating(false);
              setEditing(false);
            }}
            className="p-button-text"
          />
          <Button
            label={creating ? "Crear" : "Guardar"}
            onClick={handleSave}
            loading={isSubmitting}
            className="p-button-primary"
          />
        </div>
      </Dialog>

      <DetailModal
        header="Detalles del Evento"
        visible={viewing}
        onHide={() => setViewing(false)}
        icon="pi pi-ticket"
        title={selected?.name}
        subtitle={`ID: #${selected?.id}`}
      >
        {selected && (
          <>
            <DetailField icon="pi pi-align-left" label="Descripción" value={selected.description} />
            <DetailField
              icon="pi pi-calendar-plus"
              label="Inicio"
              value={new Date(selected.start_date).toLocaleString("es-ES")}
            />
            <DetailField
              icon="pi pi-calendar-minus"
              label="Fin"
              value={new Date(selected.end_date).toLocaleString("es-ES")}
            />
            <DetailField
              icon="pi pi-users"
              label="Conductores"
              value={
                selected.assignments
                  ? selected.assignments.map((a) => a.user?.name).join(", ")
                  : "Ninguno"
              }
            />
            <DetailField icon="pi pi-info-circle" label="Estado" value={statusTemplate(selected)} />
          </>
        )}
      </DetailModal>

      <Dialog blockScroll
        visible={!!deleteConfirm}
        onHide={() => setDeleteConfirm(null)}
        header="Confirmar"
        footer={
          <div>
            <Button
              label="No"
              icon="pi pi-times"
              onClick={() => setDeleteConfirm(null)}
              className="p-button-text"
            />
            <Button
              label="Sí"
              icon="pi pi-check"
              onClick={handleDelete}
              className="p-button-danger"
              autoFocus
              loading={isSubmitting}
            />
          </div>
        }
      >
        <p>¿Estás seguro de que deseas eliminar este evento?</p>
      </Dialog>
    </div>
  );
}
