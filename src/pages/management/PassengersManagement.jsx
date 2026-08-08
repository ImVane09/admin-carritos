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
import { fetchUsers, registerPassenger, updateUser, deleteUser, toggleUserStatus, restoreUser } from '../../services/adminService';
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
  const [statusFilter, setStatusFilter] = useState(null);
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchUsers({ per_page: 10, page, search: debouncedQuery, role_name: 'pasajero', status: statusFilter });
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
    load();
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

    setLoading(true);
    try {
      // 1. Guardar cambios en el backend (nombre, correo y opcionalmente contraseña)
      const payload = {
        name: editForm.name,
        email: editForm.email
      };
      if (editForm.password?.trim()) {
        payload.password = editForm.password.trim();
      }
      const response = await updateUser(editForm.id, payload);

      // 2. Si el estado "activo" cambió, ejecutar el toggle
      const original = users.find(u => u.id === editForm.id);
      let activeState = !!editForm.is_active;
      if (original && (!!original.is_active !== !!editForm.is_active)) {
        const toggleRes = await toggleUserStatus(editForm.id);
        if (toggleRes && toggleRes.user) {
          activeState = !!toggleRes.user.is_active;
        }
      }

      const merged = { 
        ...editForm, 
        ...response.user,
        is_active: activeState
      };
      
      if (statusFilter === 'active' && !activeState) {
        setUsers(users.filter(u => u.id !== editForm.id));
        setTotalRecords(prev => prev - 1);
      } else if (statusFilter === 'inactive' && activeState) {
        setUsers(users.filter(u => u.id !== editForm.id));
        setTotalRecords(prev => prev - 1);
      } else {
        setUsers(users.map(u => u.id === editForm.id ? merged : u));
      }
      setEditing(null);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Pasajero actualizado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error al actualizar', detail: err.response?.data?.error || 'Error en el servidor' });
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
      if (statusFilter === 'active' || statusFilter === 'inactive') {
        setUsers(users.filter(u => u.id !== deleteConfirm));
        setTotalRecords(prev => prev - 1);
      } else {
        setUsers(users.map(u => u.id === deleteConfirm ? { ...u, deleted_at: new Date().toISOString() } : u));
      }
      setDeleteConfirm(null);
      toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Pasajero eliminado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo eliminar al pasajero' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (row) => {
    setLoading(true);
    try {
      await restoreUser(row.id);
      if (statusFilter === 'deleted') {
        setUsers(users.filter(u => u.id !== row.id));
        setTotalRecords(prev => prev - 1);
      } else {
        setUsers(users.map(u => u.id === row.id ? { ...u, deleted_at: null } : u));
      }
      toast.current?.show({ severity: 'success', summary: 'Restaurado', detail: 'Pasajero restaurado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo restaurar al pasajero' });
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      // Registramos usando el endpoint público /api/register con role_id = 2 (pasajero)
      const response = await registerPassenger({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        password_confirmation: createForm.password,
        role_id: 2
      });

      const merged = {
        ...response.user,
        created_at: new Date().toISOString()
      };

      setUsers([...users, merged]);
      setCreating(false);
      toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Pasajero creado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error al crear', detail: err.response?.data?.error || err.response?.data?.message || 'Error del servidor' });
    } finally {
      setLoading(false);
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

      <Dialog
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

      <Dialog
        header="Editar Pasajero"
        visible={!!editing}
        style={{ width: '32rem' }}
        onHide={() => setEditing(null)}
      >
        {editForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Nombre</strong></label>
              <InputText
                id="name"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Correo</strong></label>
              <InputText
                id="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Nueva Contraseña (Opcional)</strong></label>
              <InputText
                id="password"
                type="password"
                value={editForm.password || ''}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full"
                placeholder="Dejar vacío para no cambiar"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="is_active"><strong>Activo</strong></label>
              <InputSwitch
                id="is_active"
                checked={editForm.is_active || false}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button label="Cancelar" onClick={() => setEditing(null)} className="p-button-text" />
              <Button label="Guardar" onClick={handleSave} className="p-button-primary" />
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
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
            ¿Confirmar suspensión?
          </h3>
          
          <p style={{
            margin: '0 0 1.5rem 0',
            fontSize: '0.9rem',
            color: '#64748b',
            lineHeight: '1.45',
            fontFamily: "'Outfit', sans-serif"
          }}>
            ¿Está seguro que desea suspender a este pasajero? Podrá restaurarlo o volver a activarlo en cualquier momento más adelante.
          </p>
          
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <Button
              label="Cancelar"
              onClick={() => setDeleteConfirm(null)}
              className="p-button-text"
              style={{ flex: 1, borderRadius: '8px' }}
            />
            <Button
              label="Suspender"
              onClick={confirmDelete}
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

      <Dialog
        header="Crear Nuevo Pasajero"
        visible={creating}
        style={{ width: '32rem' }}
        onHide={() => setCreating(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="createName" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Nombre</strong></label>
            <InputText
              id="createName"
              value={createForm.name || ''}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label htmlFor="createEmail" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Correo</strong></label>
            <InputText
              id="createEmail"
              value={createForm.email || ''}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full"
              placeholder="correo@example.com"
            />
          </div>
          <div>
            <label htmlFor="createPassword" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Contraseña</strong></label>
            <InputText
              id="createPassword"
              type="password"
              value={createForm.password || ''}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label htmlFor="createActive"><strong>Activo</strong></label>
            <InputSwitch
              id="createActive"
              checked={createForm.is_active || false}
              onChange={(e) => setCreateForm({ ...createForm, is_active: e.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button label="Cancelar" onClick={() => setCreating(false)} className="p-button-text" />
            <Button label="Crear" onClick={handleCreateSave} className="p-button-primary" />
          </div>
        </div>
      </Dialog>
    </div>
    </>
  );
}
