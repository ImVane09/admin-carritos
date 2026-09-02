import { useEffect, useMemo, useState } from 'react';
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { fetchUsers, registerPassenger, updateUser, deleteUser } from '../../services/adminService';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useRef } from 'react';
import StatCardPremium from '../../components/StatCardPremium';
import CustomDataTable from "../../components/ui/CustomDataTable";
import ManagementActionButtons from "../../components/management/ManagementActionButtons";


export default function PassengersManagement() {
  const toast = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', is_active: true });
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
      const result = await fetchUsers({ per_page: 10, page: pageNumber, search: debouncedQuery, role_id: 2, status: statusFilter });
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
      console.error('Error al cargar pasajeros:', err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los pasajeros desde el servidor.'
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
      return <span className="status-badge status-inactivo" style={{ backgroundColor: '#e57373', color: '#fff' }}>Eliminado</span>;
    }
    return (
      <span className={`status-badge status-${row.is_active ? 'activo' : 'inactivo'}`}>
        {row.is_active ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  const handleEdit = (row) => {
    setEditing(row.id);
    setEditForm({ ...row, password: '' });
  };

  const handleSave = async () => {
    if (!editForm.name?.trim() || !editForm.email?.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Datos incompletos', detail: 'Por favor, rellena nombre y correo.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        is_active: editForm.is_active,
      };
      if (editForm.password?.trim()) {
        payload.password = editForm.password.trim();
      }
      await updateUser(editForm.id, payload);

      
      setEditing(null);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Pasajero actualizado correctamente' });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error al actualizar', detail: err.response?.data?.error || 'Error en el servidor' });
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
      toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Pasajero eliminado correctamente' });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo eliminar al pasajero' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCreate = () => {
    setCreating(true);
    setCreateForm({ name: '', email: '', password: '', is_active: true });
  };

  const handleCreateSave = async () => {
    if (!createForm.name?.trim() || !createForm.email?.trim() || !createForm.password?.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Datos incompletos', detail: 'Por favor complete nombre, correo y contraseña.' });
      return;
    }
    if (createForm.password.length < 8) {
      toast.current?.show({ severity: 'warn', summary: 'Contraseña muy corta', detail: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await registerPassenger({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        is_active: createForm.is_active,
      });

      setCreating(false);
      toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Pasajero creado correctamente' });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error al crear', detail: err.response?.data?.error || err.response?.data?.message || 'Error del servidor' });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <>
    <Toast ref={toast} />
    <div className="management-section">
      <ManagementPageHeader
        title="Pasajeros"
        subtitle="Gestión de cuentas de pasajeros"
        icon="pi pi-users"
        buttonLabel="Nuevo Pasajero"
        onButtonClick={handleCreate}
      />

      <div className="dashboard-grid-premium">
        <StatCardPremium 
          title="Total Pasajeros" 
          value={globalStats.total} 
          icon="pi pi-users" 
          tone="blue" 
          subtitle="Registrados en sistema" 
          loading={loading} 
        />
        <StatCardPremium title="Inactivos" value={globalStats.inactive} icon="pi pi-user-minus" tone="amber" subtitle="En el sistema" loading={loading} />
        <StatCardPremium title="Eliminados" value={globalStats.deleted} icon="pi pi-trash" tone="red" subtitle="En el sistema" loading={loading} />
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
        title={`Lista de Pasajeros (${totalRecords})`}
        globalFilter={query}
        setGlobalFilter={setQuery}
        searchPlaceholder="Buscar por nombre o correo"
        headerElements={
          <Dropdown 
            value={statusFilter} 
            options={[
              { label: 'Todos', value: 'all' },
              { label: 'Activos', value: 'active' },
              { label: 'Inactivos', value: 'inactive' },
              { label: 'Eliminados', value: 'deleted' }
            ]} 
            optionLabel="label"
            optionValue="value"
            onChange={(e) => { setStatusFilter(e.value); setPage(1); }} 
            placeholder="Filtrar por estado" 
          />
        }
      />

      <Dialog blockScroll
        header="Detalles del Pasajero"
        visible={!!selected}
        style={{ width: '30rem' }}
        onHide={() => setSelected(null)}
        dismissableMask
      >
        {selected && (
          <div className="user-detail-card" style={{ padding: '0.5rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-700)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: '0 auto 0.5rem auto',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
              >
                {selected.name?.slice(0, 1).toUpperCase()}
              </div>
              <h3 style={{ margin: '0.3rem 0', color: 'var(--brand-900)', fontSize: '1.35rem', fontWeight: '600' }}>{selected.name}</h3>
              <p style={{ color: 'var(--ink-500)', fontSize: '0.85rem', margin: 0 }}>ID de Pasajero: #{selected.id}</p>
            </div>

            <div style={{ display: 'grid', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="pi pi-envelope" style={{ color: 'var(--brand-500)' }} /> Correo Electrónico:
                </span>
                <strong style={{ color: 'var(--ink-900)', wordBreak: 'break-all', marginLeft: '1rem', textAlign: 'right' }}>{selected.email}</strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="pi pi-check-circle" style={{ color: 'var(--brand-500)' }} /> Estado de cuenta:
                </span>
                <span className={`status-badge status-${selected.is_active ? 'activo' : 'inactivo'}`} style={{ margin: 0 }}>
                  {selected.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="pi pi-calendar" style={{ color: 'var(--brand-500)' }} /> Fecha de Registro:
                </span>
                <strong style={{ color: 'var(--ink-900)' }}>
                  {new Date(selected.created_at).toLocaleDateString('es-ES', {
                    dateStyle: 'medium'
                  })}
                </strong>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <Button
                label="Cancelar"
                onClick={() => setSelected(null)}
                className="p-button-text"
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>
        )}
      </Dialog>

      <Dialog blockScroll
        header="Editar Pasajero"
        visible={!!editing}
        style={{ width: '32rem' }}
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
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
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
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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
                    value={editForm.password || ''}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.value })}
                  />
                </div>
              </div>
            </div>
            <div className="premium-modal-footer">
              <Button label="Cancelar" onClick={() => setEditing(null)} className="p-button-text" />
              <Button label="Guardar" onClick={handleSave} className="p-button-primary" loading={isSubmitting} />
            </div>
          </>
        )}
      </Dialog>

      <Dialog blockScroll
        visible={!!deleteConfirm}
        style={{ width: '26rem', borderRadius: '16px' }}
        onHide={() => setDeleteConfirm(null)}
        showHeader={false}
      >
        <div style={{ padding: '1.5rem 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 4px 10px rgba(220, 38, 38, 0.15)'
          }}>
            <i className="pi pi-exclamation-triangle" />
          </div>
          
          <h3 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#0f172a',
            fontFamily: "'Outfit', sans-serif"
          }}>
            ¿Confirmar eliminación?
          </h3>
          
          <p style={{
            margin: '0 0 1.5rem 0',
            fontSize: '0.9rem',
            color: '#64748b',
            lineHeight: '1.45',
            fontFamily: "'Outfit', sans-serif"
          }}>
            ¿Está seguro que desea eliminar a este pasajero? El registro se conservará como historial y la acción será definitiva.
          </p>
          
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <Button
              label="Cancelar"
              onClick={() => setDeleteConfirm(null)}
              className="p-button-text"
              style={{ flex: 1, borderRadius: '8px' }}
            />
            <Button
              label="Eliminar"
              onClick={confirmDelete}
              loading={isSubmitting}
              style={{
                flex: 1,
                borderRadius: '8px',
                backgroundColor: '#dc2626',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.65rem 0',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
              }}
            />
          </div>
        </div>
      </Dialog>

      <Dialog blockScroll
        header="Crear Nuevo Pasajero"
        visible={creating}
        style={{ width: '32rem' }}
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
                value={createForm.name || ''}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
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
                value={createForm.email || ''}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
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
                value={createForm.password || ''}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
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
                onChange={(e) => setCreateForm({ ...createForm, is_active: e.value })}
              />
            </div>
          </div>
        </div>
        <div className="premium-modal-footer">
          <Button label="Cancelar" onClick={() => setCreating(false)} className="p-button-text" />
          <Button label="Crear" onClick={handleCreateSave} className="p-button-primary" loading={isSubmitting} />
        </div>
      </Dialog>
    </div>
    </>
  );
}
