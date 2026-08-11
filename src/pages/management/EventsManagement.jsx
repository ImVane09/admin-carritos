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
  assignment_ids: [],
};

export default function EventsManagement() {
  const toast = useRef(null);

  const [events, setEvents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

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
      const eventsData = await fetchEvents({ page: pageNumber, per_page: 15 });
      setEvents(eventsData?.data || []);
      setTotalRecords(eventsData?.total || 0);
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
    loadData(1);
  }, []);

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

      const payload = {
        name: form.name,
        description: form.description,
        start_date: form.start_date
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        end_date: form.end_date.toISOString().slice(0, 19).replace("T", " "),
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
      loadData(page);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al guardar el evento.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteEvent(deleteConfirm.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Evento eliminado correctamente.",
      });
      setDeleteConfirm(null);
      loadData(page);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al eliminar el evento.",
      });
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
    const now = new Date();
    const start = new Date(rowData.start_date);
    const end = new Date(rowData.end_date);

    if (now < start) {
      return <span className="status-badge status-pending">Futuro</span>;
    } else if (now > end) {
      return <span className="status-badge status-inactive">Pasado</span>;
    }
    return <span className="status-badge status-active">Activo</span>;
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
            value={events.length}
            icon="pi pi-ticket"
            tone="blue"
            subtitle="Registrados en el sistema"
            loading={loading}
          />
          <StatCardPremium
            title="Eventos Activos"
            value={
              events.filter((e) => {
                const now = new Date();
                return (
                  now >= new Date(e.start_date) && now <= new Date(e.end_date)
                );
              }).length
            }
            icon="pi pi-calendar-clock"
            tone="green"
            subtitle="En curso actualmente"
            loading={loading}
          />
          <StatCardPremium
            title="Conductores Reservados"
            value={events.reduce(
              (acc, e) => acc + (e.assignments ? e.assignments.length : 0),
              0,
            )}
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
          onPageChange={(newPage) => loadData(newPage)}
          title="Listado de Eventos"
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
            className="p-button-primary"
          />
        </div>
      </Dialog>

      <DetailModal
        visible={viewing}
        onHide={() => setViewing(false)}
        title="Detalles del Evento"
      >
        {selected && (
          <div className="flex flex-column gap-3">
            <DetailField label="ID" value={selected.id} />
            <DetailField label="Nombre" value={selected.name} />
            <DetailField label="Descripción" value={selected.description} />
            <DetailField
              label="Inicio"
              value={new Date(selected.start_date).toLocaleString("es-ES")}
            />
            <DetailField
              label="Fin"
              value={new Date(selected.end_date).toLocaleString("es-ES")}
            />
            <DetailField
              label="Conductores"
              value={
                selected.assignments
                  ? selected.assignments.map((a) => a.user?.name).join(", ")
                  : "Ninguno"
              }
            />
          </div>
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
            />
          </div>
        }
      >
        <p>¿Estás seguro de que deseas eliminar este evento?</p>
      </Dialog>
    </div>
  );
}
