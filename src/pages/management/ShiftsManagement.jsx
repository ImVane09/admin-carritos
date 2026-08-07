import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';
import { fetchShifts, createShift, updateShift, deleteShift } from '../../services/adminService';
import StatCardPremium from '../../components/StatCardPremium';


const EMPTY_FORM = { id: null, name: '', start_time: '', end_time: '', is_active: true };

export default function ShiftsManagement() {
  const toast = useRef(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalStats, setGlobalStats] = useState({ inactive: 0, deleted: 0 });
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
  });
  
  // Modal states
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const data = await fetchShifts({ page: lazyParams.page + 1, per_page: lazyParams.rows });
      setShifts(data.data || []);
      setTotalRecords(data.total || 0);
      if (data.total_inactivos !== undefined) {
        setGlobalStats({
          inactive: data.total_inactivos || 0,
          deleted: data.total_eliminados || 0,
          total: data.total_registrados || 0,
        });
      }
    } catch (err) {
      console.error('Error al cargar horarios:', err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los horarios.' });
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [lazyParams]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreating(true);
  };

  const openEdit = (shift) => {
    setForm({
      id: shift.id,
      name: shift.name,
      start_time: shift.start_time ? shift.start_time.slice(0, 5) : '',
      end_time: shift.end_time ? shift.end_time.slice(0, 5) : '',
      is_active: shift.is_active
    });
    setEditing(true);
  };

  const openView = (shift) => {
    setSelected(shift);
    setViewing(true);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(false);
    setViewing(false);
    setForm(EMPTY_FORM);
    setSelected(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.start_time || !form.end_time) {
      toast.current?.show({ severity: 'warn', summary: 'Datos incompletos', detail: 'Por favor completa todos los campos.' });
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        await updateShift(form.id, form);
        toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Horario actualizado correctamente.' });
      } else {
        await createShift(form);
        toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Horario creado correctamente.' });
      }
      closeForm();
      loadShifts();
    } catch (err) {
      console.error('Error guardando horario:', err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el horario.' });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (shift) => {
    setDeleteConfirm(shift);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      await deleteShift(deleteConfirm.id);
      toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Horario eliminado correctamente.' });
      setDeleteConfirm(null);
      loadShifts();
    } catch (err) {
      console.error('Error eliminando horario:', err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el horario.' });
    } finally {
      setLoading(false);
    }
  };

  const statusBody = (rowData) => {
    if (rowData.deleted_at) {
      return (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger-main)',
          fontWeight: 'bold',
          fontSize: '0.85rem'
        }}>
          Eliminado
        </span>
      );
    }
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        backgroundColor: rowData.is_active ? 'var(--success-light)' : 'var(--danger-light)',
        color: rowData.is_active ? 'var(--success-main)' : 'var(--danger-main)',
        fontWeight: 'bold',
        fontSize: '0.85rem'
      }}>
        {rowData.is_active ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  const actionBody = (rowData) => (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-text p-button-secondary"
        onClick={() => openView(rowData)}
        tooltip="Ver Detalles"
      />
      {!rowData.deleted_at && (
        <>
          <Button
            icon="pi pi-user-edit"
            className="p-button-rounded p-button-text p-button-info"
            onClick={() => openEdit(rowData)}
            tooltip="Editar horario"
          />
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => confirmDelete(rowData)}
            tooltip="Eliminar horario"
          />
        </>
      )}
    </div>
  );

  return (
    <div className="management-page">
      <Toast ref={toast} />
      <div className="management-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Gestión de Horarios</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Administra los turnos (Shifts) disponibles en el campus</p>
        </div>
        <Button label="Nuevo Horario" icon="pi pi-plus" onClick={openCreate} style={{ backgroundColor: 'var(--primary-main)', border: 'none' }} />
      </div>

      <div className="dashboard-grid-premium" style={{ marginBottom: '1.25rem', marginTop: '1.25rem' }}>
        <StatCardPremium title="Total Horarios" value={globalStats.total} icon="pi pi-clock" tone="amber" subtitle="Turnos definidos" loading={loading} />
        <StatCardPremium title="Inactivos" value={globalStats.inactive} icon="pi pi-clock" tone="amber" subtitle="En el sistema" loading={loading} />
        <StatCardPremium title="Eliminados" value={globalStats.deleted} icon="pi pi-trash" tone="red" subtitle="En el sistema" loading={loading} />
      </div>

      <Card>
        <DataTable
          value={shifts}
          loading={loading}
          emptyMessage="No se encontraron horarios."
          responsiveLayout="scroll"
          className="custom-datatable"
          lazy
          paginator
          first={lazyParams.first}
          rows={lazyParams.rows}
          totalRecords={totalRecords}
          onPage={(e) => setLazyParams(e)}
        >
          <Column field="id" header="ID" style={{ width: '80px' }} />
          <Column field="name" header="Nombre del Turno" />
          <Column field="start_time" header="Hora de Inicio" />
          <Column field="end_time" header="Hora de Fin" body={(r) => r.end_time?.slice(0,5)} style={{ width: '20%' }} />
          <Column header="Estado" body={statusBody} style={{ width: '15%' }} />
          <Column header="Acciones" body={actionBody} style={{ width: '15%', textAlign: 'right' }} />
        </DataTable>
      </Card>

      {/* Modal Crear/Editar */}
      <Dialog
        visible={creating || editing}
        style={{ width: '450px' }}
        header={editing ? 'Editar Horario' : 'Nuevo Horario'}
        modal
        onHide={closeForm}
        footer={
          <div>
            <Button label="Cancelar" icon="pi pi-times" onClick={closeForm} className="p-button-text" />
            <Button label="Guardar" icon="pi pi-check" onClick={handleSave} autoFocus />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre del Turno</label>
            <InputText id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Turno Mañana" />
          </div>
          
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="start_time" style={{ display: 'block', marginBottom: '0.5rem' }}>Hora de Inicio</label>
            <InputText id="start_time" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>

          <div className="p-field">
            <label htmlFor="end_time" style={{ display: 'block', marginBottom: '0.5rem' }}>Hora de Fin</label>
            <InputText id="end_time" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
          {editing && (
            <div className="p-field" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
              <InputSwitch 
                id="is_active" 
                checked={form.is_active} 
                onChange={(e) => setForm({ ...form, is_active: e.value })} 
              />
              <label htmlFor="is_active" style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>
                Activo
              </label>
            </div>
          )}
        </div>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog
        visible={viewing}
        style={{ width: '450px' }}
        header="Detalles del Horario"
        modal
        onHide={closeForm}
        footer={
          <Button label="Cerrar" icon="pi pi-times" onClick={closeForm} className="p-button-text" />
        }
      >
        {selected && (
          <div className="p-fluid">
            <p><strong>ID:</strong> {selected.id}</p>
            <p><strong>Nombre del Turno:</strong> {selected.name}</p>
            <p><strong>Hora de Inicio:</strong> {selected.start_time}</p>
            <p><strong>Hora de Fin:</strong> {selected.end_time}</p>
            <p><strong>Estado:</strong> {selected.deleted_at ? 'Eliminado' : (selected.is_active ? 'Activo' : 'Inactivo')}</p>
          </div>
        )}
      </Dialog>

      {/* Modal Confirmar Eliminación */}
      <Dialog
        visible={!!deleteConfirm}
        style={{ width: '450px' }}
        header="Confirmar Eliminación"
        modal
        onHide={() => setDeleteConfirm(null)}
        footer={
          <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDeleteConfirm(null)} className="p-button-text" />
            <Button label="Sí, Eliminar" icon="pi pi-check" onClick={handleDelete} className="p-button-danger" autoFocus />
          </div>
        }
      >
        <div className="confirmation-content" style={{ display: 'flex', alignItems: 'center' }}>
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: 'var(--danger-main)', marginRight: '1rem' }} />
          {deleteConfirm && <span>¿Estás seguro de que deseas eliminar el horario <b>{deleteConfirm.name}</b>?</span>}
        </div>
      </Dialog>
    </div>
  );
}
